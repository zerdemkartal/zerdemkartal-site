// 'hermes_site' içerik yükleyici — DB satırı varsa bölüm bazında (shallow) varsayılanın
// üstüne biner; eksik bölüm sayfayı KIRMAZ. MCP oku-birleştir-yaz ile uyumlu.
import { getContent } from './content';
import { HERMES_SITE } from './defaults';

export async function getHermes() {
  const db = await getContent('hermes_site', null);
  if (!db || typeof db !== 'object') return HERMES_SITE;
  const out = { ...HERMES_SITE };
  for (const k of Object.keys(db)) {
    out[k] = (db[k] && typeof db[k] === 'object' && !Array.isArray(db[k]) && HERMES_SITE[k])
      ? { ...HERMES_SITE[k], ...db[k] }
      : db[k];
  }
  return out;
}
