import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

const Input = z.object({
  lisansNo: z.string().regex(/^[A-Z0-9]{6}\d{10}(?:-\d{2,})?$/),
  izlemeModu: z.boolean(),
  gerekce: z.string().trim().min(3).max(1000),
  istekId: z.string().uuid()
}).strict();

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'gecersiz-istek' }, 400);
  const q = parsed.data;
  const access = await authorizeLicenseRequest({
    request,
    action: 'lisans.yaptirim_modu',
    database: prisma,
    reason: q.gerekce,
    licenseNo: q.lisansNo
  });
  if (!access.ok) return json({ error: access.error }, access.status);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const found = await tx.license.findFirst({
        where: { OR: [{ licenseNo: q.lisansNo }, { aliases: { some: { licenseNo: q.lisansNo } } }] }
      });
      if (!found) return { status: 404, body: { error: 'kayit-bulunamadi' } };
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license:${found.id}`}))`;
      const current = await tx.license.findUnique({ where: { id: found.id } });
      if (!current || current.status === 'iptal') {
        return { status: 409, body: { error: 'yaptirim-modu-degisikligi-reddedildi' } };
      }
      if (current.monitoringOnly === q.izlemeModu) {
        return { status: 409, body: { error: 'yaptirim-modu-degismedi' } };
      }
      const now = new Date();
      const updated = await tx.license.update({
        where: { id: current.id },
        data: { monitoringOnly: q.izlemeModu, authorizationVersion: { increment: 1 } }
      });
      await appendLicenseEvent(tx, {
        licenseId: current.id,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: 'lisans.yaptirim_modu',
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: { izlemeModu: current.monitoringOnly, yetkiSurumu: current.authorizationVersion },
        afterState: { izlemeModu: updated.monitoringOnly, yetkiSurumu: updated.authorizationVersion },
        requestId: q.istekId,
        createdAt: now
      });
      return {
        status: 200,
        body: {
          tamam: true,
          lisansNo: current.licenseNo,
          izlemeModu: updated.monitoringOnly,
          yetkiSurumu: updated.authorizationVersion,
          istekId: q.istekId
        }
      };
    });
    return json(result.body, result.status);
  } catch (error) {
    if (error?.code === 'P2002') return json({ error: 'istek-tekrarlandi' }, 409);
    return json({ error: 'gecici-hata' }, 503);
  }
}
