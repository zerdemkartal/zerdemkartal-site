import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// SİPARİŞ = satın alma / hak sahipliği (entitlement). LİSANS BURADA ÜRETİLMEZ.
// Masaüstü lisansı çevrimdışı imzalanır (Kripto Yönetim) → akış: ödeme → sipariş →
// kullanıcı programda "Lisans İste" → POST /api/lisans/istek → geliştirici imzalar → e-posta.
// Eski public sipariş ucu PII içeren Order kaydı açıyordu. PayTR Link akışında
// müşteriye ait veri alınmaz; gövde okunmadan bu uç kapalı tutulur.
export async function POST() {
  return Response.json({ error: 'bu_akisin_kullanimi_sona_erdi' }, { status: 410 });
}

// GET /api/orders — admin: sipariş listesi (+ bağlı lisans istekleri).
export async function GET(request) {
  const err = requireAdmin(request); if (err) return err;
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      requests: true,
      customerAccess: {
        select: {
          licenseNo: true, application: true, setupUsedAt: true,
          failedAttempts: true, lockedUntil: true, updatedAt: true
        }
      }
    }
  });
  return Response.json(rows);
}
