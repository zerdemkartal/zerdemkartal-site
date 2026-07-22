// POST /api/pay/iyzico/callback — iyzico ödeme sonrası buraya token'ı form-encoded POST'lar.
// Akış: token'ı retrieve et → SUCCESS ise Order'ı 'paid' yap + onay e-postası → /tesekkurler'e 303 yönlendir.
// Başarısızsa /fiyat?odeme=basarisiz'e döner. Bu uç PUBLIC (iyzico sunucusu çağırır) — admin token yok.
import { prisma } from '@/lib/db';
import { checkoutFormRetrieve } from '@/lib/iyzico';
import { paymentConfirmedEmail } from '@/lib/email';
import { SITE } from '@/lib/site';

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
      const order = await prisma.order
        .update({ where: { id: orderId }, data: { status: 'paid', payProvider: 'iyzico', payRef: r.paymentId || token } })
        .catch(() => null);
      if (order) {
        try {
          await paymentConfirmedEmail(order);
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
