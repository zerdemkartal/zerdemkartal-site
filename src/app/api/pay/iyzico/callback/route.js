// POST /api/pay/iyzico/callback — iyzico ödeme sonrası buraya token'ı form-encoded POST'lar.
// Akış: token'ı retrieve et → SUCCESS ise Order'ı 'paid' yap + onay e-postası → /tesekkurler'e 303 yönlendir.
// Başarısızsa /fiyat?odeme=basarisiz'e döner. Bu uç PUBLIC (iyzico sunucusu çağırır) — admin token yok.
import { prisma } from '@/lib/db';
import { checkoutFormRetrieve } from '@/lib/iyzico';
import { paymentConfirmedEmail } from '@/lib/email';
import { SITE } from '@/lib/site';
import { markPaymentEmailSent, preparePaidOrder } from '@/lib/order-payment.mjs';
import {
  createDownloadInvite,
  markDownloadInviteSent,
  revokeDownloadInvite
} from '@/lib/download-invite.mjs';

export async function POST(request) {
  let token = '';
  try {
    const form = await request.formData();
    token = (form.get('token') || '').toString();
  } catch {
    /* gövde okunamadı */
  }
  if (!token) return Response.redirect(SITE + '/fiyat?odeme=hata', 303);

  try {
    const r = await checkoutFormRetrieve(token);
    const ok = r && r.status === 'success' && r.paymentStatus === 'SUCCESS';
    const orderId = r && r.conversationId;
    if (ok && orderId) {
      const prepared = await preparePaidOrder({
        database: prisma,
        orderId,
        payProvider: 'iyzico',
        payRef: r.paymentId || token
      }).catch((error) => {
        console.error('[iyzico] ödeme kaydı hazırlanamadı', error);
        return null;
      });
      if (prepared?.shouldSendEmail) {
        try {
          const access = await createDownloadInvite({
            database: prisma,
            name: prepared.order.name,
            email: prepared.order.email,
            orderId: prepared.order.id,
            createdByRef: 'iyzico'
          });
          const sent = await paymentConfirmedEmail(prepared.order, access);
          if (sent.ok) {
            await markDownloadInviteSent({ database: prisma, inviteId: access.invite.id });
            await markPaymentEmailSent({ database: prisma, orderId: prepared.order.id });
          } else {
            await revokeDownloadInvite({ database: prisma, inviteId: access.invite.id });
          }
        } catch (e) {
          console.error('[iyzico] onay e-postası hata', e);
        }
      }
      return Response.redirect(SITE + '/tesekkurler?durum=ok', 303);
    }
    console.warn('[iyzico] ödeme başarısız/eksik', r && r.paymentStatus, r && r.errorMessage);
  } catch (e) {
    console.error('[iyzico] callback hata', e);
  }
  return Response.redirect(SITE + '/fiyat?odeme=basarisiz', 303);
}
