// Eski satın alma formu ad/e-posta/telefon/fatura verisini Vercel üzerinden alıyordu.
// Gizlilik odaklı PayTR Link akışına geçildi; gövde özellikle okunmadan reddedilir.
export async function POST() {
  return Response.json({ error: 'bu_akisin_kullanimi_sona_erdi' }, { status: 410 });
}
