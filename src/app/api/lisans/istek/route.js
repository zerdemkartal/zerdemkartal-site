import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

// LİSANS İSTEĞİ — masaüstü "Lisans İste" (C:\Hermes\lisans.html → lisansApi.iste) buraya POST eder.
// SİTE İMZALAMAZ (gizli anahtar geliştiricide, çevrimdışı "Kripto Yönetim"de — kullanıcı kararı 19 Tem).
// Site yalnız isteği kaydeder + varsa ödemeli siparişe (email) bağlar. Geliştirici çevrimdışı imzalar,
// e-postayla yollar. Yanıt lisans.html'in beklediği biçimde: { tamam, yol }.
const IstekIn = z.object({
  ad: z.string().min(1).max(80),
  soyad: z.string().min(1).max(80),
  email: z.string().email(),
  makineId: z.string().min(3).max(200),
  uygulama: z.string().max(40).default('hermes')
});

// POST /api/lisans/istek — PUBLIC (masaüstü çağırır)
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const p = IstekIn.safeParse(body);
  if (!p.success) return Response.json({ tamam: false, hata: 'eksik veya geçersiz alan' }, { status: 400 });

  // e-posta ile ödemeli siparişi bul (entitlement); yoksa da kaydet — geliştirici karar verir.
  const order = await prisma.order
    .findFirst({ where: { email: p.data.email, status: { in: ['paid', 'delivered'] } }, orderBy: { createdAt: 'desc' } })
    .catch(() => null);

  await prisma.licenseRequest.create({ data: { ...p.data, orderId: order?.id || null } });
  return Response.json({ tamam: true, yol: 'internet' }, { status: 201 });
}

// GET /api/lisans/istek — admin: imzalanacak/işlenen istekler (sipariş eşleşmesiyle).
export async function GET(request) {
  const err = requireAdmin(request); if (err) return err;
  const rows = await prisma.licenseRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { order: true } });
  return Response.json(rows);
}
