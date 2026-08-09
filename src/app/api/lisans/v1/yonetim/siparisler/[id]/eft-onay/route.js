import { prisma } from '@/lib/db';
import { preparePaidOrder } from '@/lib/order-payment.mjs';
import { paymentConfirmedEmail } from '@/lib/email';
import {
  createDownloadInvite,
  markDownloadInviteSent,
  revokeDownloadInvite
} from '@/lib/download-invite.mjs';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Input = z.object({
  gerekce: z.string().trim().min(3).max(1000),
  odemeReferansi: z.string().trim().max(100).optional(),
  istekId: z.string().uuid()
}).strict();

export async function POST(request, props) {
  const params = await props.params;
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'gecersiz-istek' }, { status: 400 });
  const q = parsed.data;
  const access = await authorizeLicenseRequest({
    request,
    action: 'siparis.eft_onayla',
    database: prisma,
    reason: q.gerekce
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

  const repeated = await prisma.licenseEvent.findUnique({
    where: { requestId: q.istekId },
    select: { id: true }
  });
  if (repeated) {
    return Response.json({ tamam: true, tekrar: true, istekId: q.istekId }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  try {
    const prepared = await preparePaidOrder({
      database: prisma,
      orderId: params.id,
      payProvider: 'eft',
      payRef: q.odemeReferansi || undefined
    });

    if (!prepared.shouldSendEmail && prepared.order.paymentEmailSentAt) {
      return Response.json({
        tamam: true,
        tekrar: true,
        siparisId: prepared.order.id,
        epostaGonderildi: true,
        istekId: q.istekId
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    let downloadAccess = null;
    if (prepared.shouldSendEmail) {
      downloadAccess = await createDownloadInvite({
        database: prisma,
        name: prepared.order.name,
        email: prepared.order.email,
        orderId: prepared.order.id,
        createdByRef: access.actor.id
      });
      const sent = await paymentConfirmedEmail(prepared.order, downloadAccess);
      if (!sent.ok) {
        await revokeDownloadInvite({ database: prisma, inviteId: downloadAccess.invite.id });
        return Response.json({
          error: 'e-posta-gonderilemedi',
          tekrarEdilebilir: true
        }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
      }
      await markDownloadInviteSent({ database: prisma, inviteId: downloadAccess.invite.id });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: prepared.order.id },
        data: { paymentEmailSentAt: prepared.order.paymentEmailSentAt || now }
      });
      await appendLicenseEvent(tx, {
        licenseId: null,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: 'siparis.eft_onayla',
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: {
          siparisId: prepared.order.id,
          durum: prepared.order.status,
          epostaGonderildi: Boolean(prepared.order.paymentEmailSentAt)
        },
        afterState: {
          siparisId: prepared.order.id,
          durum: 'paid',
          epostaGonderildi: true
        },
        requestId: q.istekId,
        createdAt: now
      });
    });

    return Response.json({
      tamam: true,
      siparisId: prepared.order.id,
      epostaGonderildi: true,
      indirmeDavetiSonGecerlilik: downloadAccess?.passwordExpiresAt || null,
      istekId: q.istekId
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error?.message === 'siparis-bulunamadi') {
      return Response.json({ error: 'siparis-bulunamadi' }, { status: 404 });
    }
    if (error?.message === 'iptal-edilmis-siparis') {
      return Response.json({ error: 'iptal-edilmis-siparis' }, { status: 409 });
    }
    if (error?.code === 'P2002') {
      return Response.json({ error: 'istek-tekrarlandi' }, { status: 409 });
    }
    console.error('[eft-confirm] hata', String(error?.message || error));
    return Response.json({ error: 'gecici-hata' }, { status: 503 });
  }
}
