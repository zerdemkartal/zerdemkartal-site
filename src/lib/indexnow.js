import { SITE } from './site';

/** IndexNow pingi (FAZLAR §2.7) — INDEXNOW_KEY env yoksa sessiz no-op.
 *  Anahtar dosyası /indexnow.txt route'undan servis edilir (keyLocation).
 *  İçerik yazan admin uçları değişen URL'lerle çağırır; hata yutulur (yazma akışını asla bozmaz). */
export async function pingIndexNow(paths) {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !paths || !paths.length) return;
  const body = {
    host: new URL(SITE).host,
    key,
    keyLocation: SITE + '/indexnow.txt',
    urlList: paths.map((p) => (p.startsWith('http') ? p : SITE + p))
  };
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body)
    });
  } catch { /* ping başarısızlığı içerik yazmayı etkilemez */ }
}
