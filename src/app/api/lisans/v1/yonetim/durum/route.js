import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const StatusInput = z.object({
  lisansNo: z.string().regex(/^[A-Z0-9]{6}\d{10}(?:-\d{2,})?$/),
  durum: z.enum(['aktif', 'askida', 'iptal']),
  gerekce: z.string().trim().min(3).max(1000),
  askiGun: z.number().int().min(1).max(365).optional(),
  lisansNoOnayi: z.string().max(40).optional(),
  istekId: z.string().uuid()
}).strict();

const ACTION = {
  aktif: 'lisans.etkinlestir',
  askida: 'lisans.askiya_al',
  iptal: 'lisans.kalici_iptal'
};

function allowedTransition(from, to) {
  if (from === 'iptal') return false;
  if (to === 'askida') return from === 'aktif' || from === 'bakim';
  if (to === 'aktif') return ['askida', 'suresi_doldu', 'cihaz_transferi'].includes(from);
  return to === 'iptal';
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = StatusInput.safeParse(raw);
  if (!parsed.success) return Response.json({ error: 'gecersiz-istek' }, { status: 400 });
  const q = parsed.data;
  const access = await authorizeLicenseRequest({
    request,
    action: ACTION[q.durum],
    database: prisma,
    reason: q.gerekce,
    suspensionDays: q.askiGun,
    licenseNo: q.lisansNo,
    licenseNoConfirmation: q.lisansNoOnayi
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const license = await tx.license.findFirst({
        where: { OR: [{ licenseNo: q.lisansNo }, { aliases: { some: { licenseNo: q.lisansNo } } }] }
      });
      if (!license) return { status: 404, body: { error: 'kayit-bulunamadi' } };
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license:${license.id}`}))`;
      const current = await tx.license.findUnique({ where: { id: license.id } });
      if (!current || !allowedTransition(current.status, q.durum)) {
        return { status: 409, body: { error: 'durum-gecisi-reddedildi' } };
      }
      const now = new Date();
      const suspendedUntil = q.durum === 'askida' && q.askiGun
        ? new Date(now.getTime() + q.askiGun * 24 * 60 * 60 * 1000)
        : null;
      const updated = await tx.license.update({
        where: { id: current.id },
        data: {
          status: q.durum,
          statusReason: q.gerekce,
          statusChangedAt: now,
          suspendedUntil,
          permanentlyRevokedAt: q.durum === 'iptal' ? now : current.permanentlyRevokedAt
        }
      });
      await appendLicenseEvent(tx, {
        licenseId: current.id,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: ACTION[q.durum],
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: { durum: current.status, askiBitisi: current.suspendedUntil },
        afterState: { durum: updated.status, askiBitisi: updated.suspendedUntil },
        requestId: q.istekId,
        createdAt: now
      });
      return {
        status: 200,
        body: {
          tamam: true,
          lisansNo: current.licenseNo,
          durum: updated.status,
          askiBitisi: updated.suspendedUntil,
          kalici: updated.status === 'iptal',
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
