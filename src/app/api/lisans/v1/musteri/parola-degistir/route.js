export const dynamic = 'force-dynamic';

export async function POST() {
  return Response.json(
    { tamam: false, kod: 'musteri-hesabi-kapatildi', hata: 'Müşteri hesabı kullanılmıyor.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );
}
