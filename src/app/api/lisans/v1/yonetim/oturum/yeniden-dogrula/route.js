import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import {
  LICENSE_REAUTH_MS,
  licenseMfaKey,
  recordAuthFailure,
  secondFactorUpdate,
  verifySecondFactor
} from '@/lib/license/admin-auth.mjs';
import { z } from 'zod';

const Input = z.object({
  kod: z.string().regex(/^\d{6}$/).optional(),
  kurtarmaKodu: z.string().min(12).max(20).optional()
}).strict().refine((value) => Boolean(value.kod) !== Boolean(value.kurtarmaKodu));

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  let key;
  try { key = licenseMfaKey(); } catch { return json({ error: 'lisans-servisi-hazirlikta' }, 503); }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'gecersiz-istek' }, 400);
  const access = await authorizeLicenseRequest({
    request, action: 'lisans.listele', database: prisma
  });
  if (!access.ok) return json({ error: access.error }, access.status);
  const now = new Date();
  const user = await prisma.adminUser.findUnique({ where: { id: access.actor.id } });
  const factor = verifySecondFactor({
    user, code: parsed.data.kod, recoveryCode: parsed.data.kurtarmaKodu, key, now
  });
  if (!user?.licenseGoogleSub || !factor.ok) {
    await recordAuthFailure(prisma, user?.id, now);
    return json({ error: 'yeniden-dogrulama-basarisiz' }, 401);
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-auth:${user.id}`}))`;
      const fresh = await tx.adminUser.findUnique({ where: { id: user.id } });
      const current = verifySecondFactor({
        user: fresh, code: parsed.data.kod, recoveryCode: parsed.data.kurtarmaKodu, key, now
      });
      if (!fresh.licenseGoogleSub || !current.ok) throw new Error('factor-replayed');
      await tx.adminUser.update({
        where: { id: fresh.id },
        data: { ...secondFactorUpdate(current), licenseFailedAttempts: 0, licenseLockedUntil: null }
      });
      await tx.adminSession.update({
        where: { id: access.sessionId }, data: { reauthenticatedAt: now, lastSeenAt: now }
      });
    });
    return json({ tamam: true, yenidenDogrulamaBitisi: new Date(now.getTime() + LICENSE_REAUTH_MS) });
  } catch {
    return json({ error: 'yeniden-dogrulama-basarisiz' }, 401);
  }
}
