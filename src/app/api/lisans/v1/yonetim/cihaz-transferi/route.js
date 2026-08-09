import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

const Input = z.object({
  lisansNo: z.string().regex(/^[A-Z0-9]{6}\d{10}(?:-\d{2,})?$/),
  cihazId: z.string().uuid().optional(),
  gerekce: z.string().trim().min(3).max(1000),
  istekId: z.string().uuid()
}).strict();

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'gecersiz-istek' }, { status: 400 });
  const q = parsed.data;
  const access = await authorizeLicenseRequest({
    request,
    action: 'lisans.cihaz_transferi',
    database: prisma,
    reason: q.gerekce,
    licenseNo: q.lisansNo
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const found = await tx.license.findFirst({
        where: { OR: [{ licenseNo: q.lisansNo }, { aliases: { some: { licenseNo: q.lisansNo } } }] }
      });
      if (!found) return { status: 404, body: { error: 'kayit-bulunamadi' } };
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license:${found.id}`}))`;
      const license = await tx.license.findUnique({ where: { id: found.id } });
      if (!license || license.status === 'iptal') {
        return { status: 409, body: { error: 'cihaz-transferi-reddedildi' } };
      }
      const where = { licenseId: license.id, active: true, ...(q.cihazId ? { id: q.cihazId } : {}) };
      const activeDevices = await tx.licenseDevice.findMany({ where, select: { id: true } });
      if (!activeDevices.length) return { status: 409, body: { error: 'etkin-cihaz-bulunamadi' } };
      const now = new Date();
      await tx.licenseDevice.updateMany({
        where: { id: { in: activeDevices.map((item) => item.id) } },
        data: { active: false, releasedAt: now }
      });
      const updated = await tx.license.update({
        where: { id: license.id },
        data: {
          status: 'cihaz_transferi',
          statusReason: q.gerekce,
          statusChangedAt: now,
          suspendedUntil: null
        }
      });
      await appendLicenseEvent(tx, {
        licenseId: license.id,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: 'lisans.cihaz_transferi',
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: { durum: license.status, birakilanCihazSayisi: activeDevices.length },
        afterState: { durum: updated.status, etkinCihazSayisi: 0 },
        requestId: q.istekId,
        createdAt: now
      });
      return {
        status: 200,
        body: {
          tamam: true,
          lisansNo: license.licenseNo,
          durum: updated.status,
          birakilanCihazSayisi: activeDevices.length,
          istekId: q.istekId
        }
      };
    });
    return Response.json(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error?.code === 'P2002') return Response.json({ error: 'istek-tekrarlandi' }, { status: 409 });
    return Response.json({ error: 'gecici-hata' }, { status: 503 });
  }
}
