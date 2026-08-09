import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/db';
import { licenseAccountUsable, recordAuthFailure } from '@/lib/license/admin-auth.mjs';
import {
  createLicenseGoogleChallenge,
  licenseGoogleClientId,
  licenseGoogleOwnerEmail,
  verifyLicenseGoogleCredential
} from '@/lib/license/google-auth.mjs';
import { z } from 'zod';

const Input = z.object({ credential: z.string().min(100).max(12000) }).strict();

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  let clientId;
  let ownerEmail;
  try {
    clientId = licenseGoogleClientId();
    ownerEmail = licenseGoogleOwnerEmail();
  } catch {
    return json({ error: 'google-girisi-hazir-degil' }, 503);
  }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'gecersiz-istek' }, 400);

  let identity;
  try {
    identity = await verifyLicenseGoogleCredential({
      credential: parsed.data.credential,
      clientId,
      verifier: new OAuth2Client(clientId)
    });
  } catch {
    return json({ error: 'google-girisi-dogrulanamadi' }, 401);
  }
  if (identity.email !== ownerEmail) return json({ error: 'google-hesabi-yetkisiz' }, 403);

  const now = new Date();
  const user = await prisma.adminUser.findUnique({ where: { email: ownerEmail } });
  if (
    !licenseAccountUsable(user, now) ||
    user.licenseRole !== 'sahip' ||
    !user.licenseMfaEnabled ||
    !user.licenseMfaSecretCipher ||
    (user.licenseGoogleSub && user.licenseGoogleSub !== identity.googleSub)
  ) {
    if (user) await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'google-girisi-dogrulanamadi' }, 401);
  }

  try {
    return json({
      tamam: true,
      ...createLicenseGoogleChallenge({
        user,
        googleSub: identity.googleSub,
        request,
        now,
        jwtSecret: process.env.JWT_SECRET
      })
    });
  } catch {
    return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  }
}
