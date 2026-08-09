import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');

const defaults = read('src/lib/defaults.js');
const migration = read('src/lib/hermesPricing.js');
const pricePage = read('src/app/fiyat/page.jsx');
const purchasePage = read('src/app/satin-al/SatinAlForm.jsx');
const legalPage = read('src/app/yasal/[slug]/page.jsx');
const llms = read('src/app/llms.txt/route.js');
const publicContract = [defaults, pricePage, purchasePage, legalPage, llms].join('\n');

for (const required of [
  'Her cihaz için ayrı lisans',
  '17 Ağustos 2026',
  'Android, iPhone ve iPad',
  'ayrı abonelik',
  'yalnız etkinleştirildiği bir cihazda geçerlidir'
]) {
  assert.ok(publicContract.includes(required), `Eksik lisans/platform ifadesi: ${required}`);
}

for (const retired of [
  'tek lisans hepsinde geçerli olacak',
  'Ek ücret yok — aynı lisans',
  'Web ve Android sürümleri',
  'Lisans platforma değil, sana bağlı',
  'Yeniden ödeme yok',
  'Abonelik YOK'
]) {
  assert.ok(!publicContract.includes(retired), `Eski/yanıltıcı ifade kaldı: ${retired}`);
}

assert.match(migration, /retiredQuestions/);
assert.match(migration, /Cihazlar arası veri senkronizasyonu/);
assert.match(migration, /Her lisans yalnız bir cihazda geçerlidir/);

console.log('site lisans metni: 3/3 kontrol geçti');
