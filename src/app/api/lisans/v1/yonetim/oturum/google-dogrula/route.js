import { prisma } from '@/lib/db';
import {
  createLicenseSession,
  licenseAccountUsable,
  licenseMfaKey,
  recordAuthFailure,
  secondFactorUpdate,
  verifySecondFactor
} from '@/lib/license/admin-auth.mjs';
import {
  licenseGoogleOwnerEmail,
  verifyLicenseGoogleChallenge
} from '@/lib/license/google-auth.mjs';
import { z } from 'zod';

const Input = z.object({
  challenge: z.string().min(20).max(4000),
  kod: z.string().regex(/^\d{6}$/).optional(),
  kurtarmaKodu: z.string().min(12).max(20).optional()
}).strict().refine((value) => Boolean(value.kod) !== Boolean(value.kurtarmaKodu));

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  let key;
  let ownerEmail;
  try {
    key = licenseMfaKey();
    ownerEmail = licenseGoogleOwnerEmail();
  } catch {
    return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'gecersiz-istek' }, 400);

  let claims;
  try {
    claims = verifyLicenseGoogleChallenge({
      challenge: parsed.data.challenge,
      request,
      jwtSecret: process.env.JWT_SECRET
    });
  } catch {
    return json({ error: 'google-oturumu-gecersiz' }, 401);
  }
  if (claims.sub !== ownerEmail) return json({ error: 'google-oturumu-gecersiz' }, 401);

  const now = new Date();
  const user = await prisma.adminUser.findUnique({ where: { email: ownerEmail } });
  if (
    !licenseAccountUsable(user, now) ||
    user.licenseRole !== 'sahip' ||
    user.licenseAuthVersion !== claims.authVersion ||
    (user.licenseGoogleSub && user.licenseGoogleSub !== claims.googleSub)
  ) {
    if (user) await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'mfa-dogrulanamadi' }, 401);
  }
  const factor = verifySecondFactor({
    user,
    code: parsed.data.kod,
    recoveryCode: parsed.data.kurtarmaKodu,
    key,
    now
  });
  if (!factor.ok) {
    await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'mfa-dogrulanamadi' }, 401);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-auth:${user.id}`}))`;
      const fresh = await tx.adminUser.findUnique({ where: { id: user.id } });
      const currentFactor = verifySecondFactor({
        user: fresh,
        code: parsed.data.kod,
        recoveryCode: parsed.data.kurtarmaKodu,
        key,
        now
      });
      if (
        !licenseAccountUsable(fresh, now) ||
        fresh.licenseRole !== 'sahip' ||
        fresh.licenseAuthVersion !== claims.authVersion ||
        (fresh.licenseGoogleSub && fresh.licenseGoogleSub !== claims.googleSub) ||
        !currentFactor.ok
      ) throw new Error('auth-invalid');
      const updated = await tx.adminUser.update({
        where: { id: fresh.id },
        data: {
          ...secondFactorUpdate(currentFactor),
          licenseGoogleSub: fresh.licenseGoogleSub || claims.googleSub,
          licenseFailedAttempts: 0,
          licenseLockedUntil: null,
          licenseLastLoginAt: now
        }
      });
      return {
        ...(await createLicenseSession({
          tx,
          user: updated,
          request,
          now,
          jwtSecret: process.env.JWT_SECRET
        })),
        role: updated.licenseRole
      };
    });
    return json({ tamam: true, ...result });
  } catch {
    await recordAuthFailure(prisma, user.id, now);
    return json({ error: 'mfa-dogrulanamadi' }, 401);
  }
}
