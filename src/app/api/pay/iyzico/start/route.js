// POST /api/pay/iyzico/start — ödeme sayfası başlatır.
// Gövde: { orderId } (mevcut sipariş) VEYA { name, email, product?, price? } (yeni pending sipariş oluşturur).
// Dönüş: { orderId, token, paymentPageUrl } → istemci window.location = paymentPageUrl yapar.
// iyzico anahtarı yoksa 503 → istemci "dürüst ön sipariş" akışına düşebilir (OnSiparis).
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { checkoutFormInitialize, iyzicoConfigured } from '@/lib/iyzico';

const In = z.object({
  orderId: z.string().optional(),
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  product: z.string().max(80).default('Hermes'),
  price: z.number().int().nonnegative().default(3000)
});

export async function POST(request) {
  if (!iyzicoConfigured()) {
    return Response.json({ error: 'odeme_yapilandirilmadi' }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const p = In.safeParse(body);
  if (!p.success) return Response.json({ error: 'geçersiz gövde' }, { status: 400 });

  let order;
  if (p.data.orderId) {
    order = await prisma.order.findUnique({ where: { id: p.data.orderId } });
    if (!order) return Response.json({ error: 'sipariş bulunamadı' }, { status: 404 });
  } else {
    if (!p.data.name || !p.data.email) {
      return Response.json({ error: 'ad ve e-posta gerekli' }, { status: 400 });
    }
    order = await prisma.order.create({
      data: {
        name: p.data.name,
        email: p.data.email,
        product: p.data.product,
        price: p.data.price,
        status: 'pending',
        payProvider: 'iyzico'
      }
    });
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || undefined;
  try {
    const r = await checkoutFormInitialize({ order, buyer: { name: order.name, email: order.email }, ip });
    if (r.status !== 'success') {
      console.error('[iyzico] initialize başarısız', r.errorCode, r.errorMessage);
      return Response.json({ error: r.errorMessage || 'ödeme başlatılamadı' }, { status: 502 });
    }
    await prisma.order.update({ where: { id: order.id }, data: { payProvider: 'iyzico', payRef: r.token } });
    return Response.json({ orderId: order.id, token: r.token, paymentPageUrl: r.paymentPageUrl });
  } catch (e) {
    console.error('[iyzico] initialize hata', e);
    return Response.json({ error: 'ödeme sağlayıcı hatası' }, { status: 502 });
  }
}
