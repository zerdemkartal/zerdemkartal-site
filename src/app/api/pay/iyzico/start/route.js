// PII alan eski iyzico başlangıcı kullanım dışıdır. Kartlı ödeme yalnız PayTR Link
// üzerinden başlatılır ve bu uç istek gövdesini özellikle okumaz.
export async function POST() {
  return Response.json({ error: 'bu_akisin_kullanimi_sona_erdi' }, { status: 410 });
}
