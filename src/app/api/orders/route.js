import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

// SİPARİŞ = satın alma / hak sahipliği (entitlement). LİSANS BURADA ÜRETİLMEZ.
// Masaüstü lisansı çevrimdışı imzalanır (Kripto Yönetim) → akış: ödeme → sipariş →
// kullanıcı programda "Lisans İste" → POST /api/lisans/istek → geliştirici imzalar → e-posta.
const OrderIn = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  product: z.string().max(80).default('Hermes'),
  price: z.number().int().nonnegative().default(3000),
  payProvider: z.string().max(40).optional(),
  payRef: z.string().max(200).optional()
});

// POST /api/orders — public: ön sipariş/satın alma kaydı. Ödeme sağlayıcısı (iyzico/PayTR) H2'de
// bağlanınca PSP callback'i status'ü 'paid'e çeker; şimdilik 'pending' oluşur.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const p = OrderIn.safeParse(body);
  if (!p.success) return Response.json({ error: 'geçersiz gövde' }, { status: 400 });
  const row = await prisma.order.create({ data: { ...p.data, status: 'pending' } });
  return Response.json({ id: row.id, status: row.status }, { status: 201 });
}

// GET /api/orders — admin: sipariş listesi (+ bağlı lisans istekleri).
export async function GET(request) {
  const err = requireAdmin(request); if (err) return err;
  const rows = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { requests: true } });
  return Response.json(rows);
}
