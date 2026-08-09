import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Masaüstü makine kimliği Vercel/Neon'a alınmaz. Güncel uygulama isteği doğrudan
// Apps Script üzerinden çevrimdışı Kripto Lisans Yönetimi'ne yollar.
export async function POST() {
  return Response.json(
    {
      tamam: false,
      kod: 'dogrudan-lisans-iste-kullan',
      hata: 'Lisans talebi Hermes programındaki Lisans İste bölümü üzerinden gönderilmelidir.'
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );
}

// Geçmiş Vercel kayıtları yalnız yönetici görünümü için okunabilir kalır.
export async function GET(request) {
  const err = requireAdmin(request); if (err) return err;
  const rows = await prisma.licenseRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { order: true } });
  return Response.json(rows);
}
