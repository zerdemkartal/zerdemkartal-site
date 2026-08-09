import { prisma } from '@/lib/db';
import {
  createLicenseSession,
  licenseAccountUsable,
  licenseMfaKey,
  normalizeAdminEmail,
  passwordMatches,
  recordAuthFailure
} from '@/lib/license/admin-auth.mjs';
import {
  decryptMfaSecret,
  generateRecoveryCodes,
  recoveryCodeHash,
  verifyTotp
} from '@/lib/license/mfa.mjs';
import { z } from 'zod';

const Input = z.object({
  email: z.string().email().max(200),
  sifre: z.string().min(1).max(200),
  kod: z.string().regex(/^\d{6}$/)
}).strict();

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  if (process.env.LICENSE_GOOGLE_ONLY === '1') return json({ error: 'google-girisi-zorunlu' }, 410);
  let key;
  try { key = licenseMfaKey(); } catch { return json({ error: 'lisans-servisi-hazirlikta' }, 503); }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'gecersiz-istek' }, 400);
  const q = parsed.data;
  const now = new Date();
  const user = await prisma.adminUser.findUnique({ where: { email: normalizeAdminEmail(q.email) } });
  const passwordOk = await passwordMatches(user, q.sifre);
  if (!passwordOk || !licenseAccountUsable(user, now) || user.licenseMfaEnabled) {
    if (user) await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'mfa-dogrulanamadi' }, 401);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-auth:${user.id}`}))`;
      const fresh = await tx.adminUser.findUnique({ where: { id: user.id } });
      if (!fresh?.licenseMfaPendingCipher || !fresh.licenseMfaPendingExpiresAt ||
          new Date(fresh.licenseMfaPendingExpiresAt).getTime() <= now.getTime()) throw new Error('pending-expired');
      const secret = decryptMfaSecret(fresh.licenseMfaPendingCipher, key);
      const counter = verifyTotp({ secret, token: q.kod, now });
      if (counter === null) throw new Error('totp-invalid');
      const recoveryCodes = generateRecoveryCodes();
      const updated = await tx.adminUser.update({
        where: { id: fresh.id },
        data: {
          licenseMfaEnabled: true,
          licenseMfaSecretCipher: fresh.licenseMfaPendingCipher,
          licenseMfaPendingCipher: null,
          licenseMfaPendingExpiresAt: null,
          licenseMfaLastCounter: counter,
          licenseMfaRecoveryHashes: recoveryCodes.map(recoveryCodeHash),
          licenseFailedAttempts: 0,
          licenseLockedUntil: null,
          licenseLastLoginAt: now
        }
      });
      return {
        ...(await createLicenseSession({
          tx, user: updated, request, now, jwtSecret: process.env.JWT_SECRET
        })),
        role: updated.licenseRole,
        recoveryCodes
      };
    });
    return json({ tamam: true, ...result });
  } catch {
    await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'mfa-dogrulanamadi' }, 401);
  }
}
