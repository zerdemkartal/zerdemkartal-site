import { prisma } from '@/lib/db';
import {
  createLicenseSession,
  licenseAccountUsable,
  licenseMfaKey,
  normalizeAdminEmail,
  passwordMatches,
  recordAuthFailure,
  secondFactorUpdate,
  verifySecondFactor
} from '@/lib/license/admin-auth.mjs';
import { z } from 'zod';

const LoginInput = z.object({
  email: z.string().email().max(200),
  sifre: z.string().min(1).max(200),
  kod: z.string().regex(/^\d{6}$/).optional(),
  kurtarmaKodu: z.string().min(12).max(20).optional()
}).strict().refine((value) => !(value.kod && value.kurtarmaKodu), {
  message: 'en fazla bir ikinci faktor kabul edilir'
});

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  if (process.env.LICENSE_GOOGLE_ONLY === '1') return json({ error: 'google-girisi-zorunlu' }, 410);
  let key;
  try { key = licenseMfaKey(); } catch { return json({ error: 'lisans-servisi-hazirlikta' }, 503); }
  const parsed = LoginInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'gecersiz-istek' }, 400);
  const q = parsed.data;
  const now = new Date();
  const user = await prisma.adminUser.findUnique({ where: { email: normalizeAdminEmail(q.email) } });
  const passwordOk = await passwordMatches(user, q.sifre);
  if (!passwordOk || !licenseAccountUsable(user, now)) {
    if (user) await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'giris-dogrulanamadi' }, 401);
  }
  if (!user.licenseMfaEnabled || !user.licenseMfaSecretCipher) {
    return json({ error: 'mfa-kurulumu-gerekli' }, 409);
  }
  if (!q.kod && !q.kurtarmaKodu) {
    await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'giris-dogrulanamadi' }, 401);
  }
  const factor = verifySecondFactor({
    user, code: q.kod, recoveryCode: q.kurtarmaKodu, key, now
  });
  if (!factor.ok) {
    await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'giris-dogrulanamadi' }, 401);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-auth:${user.id}`}))`;
      const fresh = await tx.adminUser.findUnique({ where: { id: user.id } });
      const currentFactor = verifySecondFactor({
        user: fresh, code: q.kod, recoveryCode: q.kurtarmaKodu, key, now
      });
      if (!licenseAccountUsable(fresh, now) || !currentFactor.ok) throw new Error('auth-invalid');
      const updated = await tx.adminUser.update({
        where: { id: fresh.id },
        data: {
          ...secondFactorUpdate(currentFactor),
          licenseFailedAttempts: 0,
          licenseLockedUntil: null,
          licenseLastLoginAt: now
        }
      });
      return {
        ...(await createLicenseSession({
          tx, user: updated, request, now, jwtSecret: process.env.JWT_SECRET
        })),
        role: updated.licenseRole
      };
    });
    return json({ tamam: true, ...result });
  } catch {
    await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'giris-dogrulanamadi' }, 401);
  }
}
