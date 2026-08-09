import { prisma } from '@/lib/db';
import {
  LICENSE_MFA_ENROLLMENT_MS,
  licenseAccountUsable,
  licenseMfaKey,
  normalizeAdminEmail,
  passwordMatches,
  recordAuthFailure
} from '@/lib/license/admin-auth.mjs';
import { encryptMfaSecret, generateTotpSecret, totpAuthUri } from '@/lib/license/mfa.mjs';
import { z } from 'zod';

const Input = z.object({
  email: z.string().email().max(200),
  sifre: z.string().min(1).max(200)
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
  const email = normalizeAdminEmail(parsed.data.email);
  const now = new Date();
  const user = await prisma.adminUser.findUnique({ where: { email } });
  const passwordOk = await passwordMatches(user, parsed.data.sifre);
  if (!passwordOk || !licenseAccountUsable(user, now)) {
    if (user) await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'giris-dogrulanamadi' }, 401);
  }
  if (user.licenseMfaEnabled) return json({ error: 'mfa-zaten-etkin' }, 409);
  const secret = generateTotpSecret();
  const expiresAt = new Date(now.getTime() + LICENSE_MFA_ENROLLMENT_MS);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      licenseMfaPendingCipher: encryptMfaSecret(secret, key),
      licenseMfaPendingExpiresAt: expiresAt
    }
  });
  return json({
    tamam: true,
    manuelAnahtar: secret,
    otpauth: totpAuthUri({ secret, email }),
    expiresAt
  });
}
