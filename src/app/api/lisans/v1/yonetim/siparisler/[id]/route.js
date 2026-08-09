import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Input = z.object({
  onay: z.literal('SİL'),
  gerekce: z.string().trim().min(3).max(1000),
  istekId: z.string().uuid()
}).strict();

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request, props) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  const params = await props.params;
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'gecersiz-istek' }, 400);
  const q = parsed.data;
  const access = await authorizeLicenseRequest({
    request,
    action: 'siparis.kalici_sil',
    database: prisma,
    reason: q.gerekce
  });
  if (!access.ok) return json({ error: access.error }, access.status);

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order-delete:${params.id}`}))`;
      const order = await tx.order.findUnique({
        where: { id: params.id },
        include: {
          _count: { select: { requests: true, downloadInvites: true } },
          customerAccess: { select: { id: true } }
        }
      });
      if (!order) return { status: 404, body: { error: 'siparis-bulunamadi' } };
      const bagliKayit = order._count.requests > 0 || order._count.downloadInvites > 0 || Boolean(order.customerAccess);
      const odemeIzi = order.status !== 'pending' || Boolean(order.paidAt || order.paymentEmailSentAt || order.payRef);
      if (bagliKayit || odemeIzi) {
        return { status: 409, body: { error: 'siparis-silinemez-bagli-kayit' } };
      }
      await appendLicenseEvent(tx, {
        licenseId: null,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: 'siparis.kalici_sil',
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: {
          siparisId: order.id,
          ad: order.name,
          eposta: order.email,
          durum: order.status,
          tutar: order.price
        },
        afterState: { silindi: true },
        requestId: q.istekId,
        createdAt: new Date()
      });
      await tx.order.delete({ where: { id: order.id } });
      return { status: 200, body: { tamam: true, silinenSiparisId: order.id, istekId: q.istekId } };
    });
    return json(result.body, result.status);
  } catch (error) {
    if (error?.code === 'P2002') return json({ error: 'istek-tekrarlandi' }, 409);
    return json({ error: 'gecici-hata' }, 503);
  }
}
