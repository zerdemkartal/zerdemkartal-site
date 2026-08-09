export const dynamic = 'force-dynamic';

export async function POST() {
  return Response.json(
    {
      tamam: false,
      kod: 'yerel-lisans-iste-kullan',
      hata: 'Lisans talebi için Hermes programındaki Lisans İste bölümünü kullanın.'
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );
}
