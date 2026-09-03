import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  LICENSE_DEVICE_PRICES,
  LICENSE_SECOND_DEVICE_PRICE,
  PURCHASE_TERMS_VERSION
} from '../src/lib/licensePricing.js';

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
  'yalnız etkinleştirildiği bir cihazda geçerlidir',
  '₺8.500',
  '₺3.000',
  '₺11.500',
  'PayTR ödeme ekranı özeti',
  '3 Eylül 2026'
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
assert.match(defaults, /btn2: 'Satın al', btn2Href: '\/satin-al'/);
assert.match(migration, /hero: \{ \.\.\.model\.home\?\.hero, btn2: 'Satın al', btn2Href: '\/satin-al' \}/);
assert.ok(!defaults.includes("btn2: 'Satın al — EFT/Havale ₺6.000'"));
assert.equal(LICENSE_DEVICE_PRICES[1], 8500);
assert.equal(LICENSE_DEVICE_PRICES[2], 11500);
assert.equal(LICENSE_SECOND_DEVICE_PRICE, 3000);
assert.equal(PURCHASE_TERMS_VERSION, '20260903');
assert.ok(!publicContract.includes('₺6.000'));
assert.ok(!publicContract.includes('₺2.500'));

console.log('site lisans, fiyat ve PayTR müşteri metni: 12/12 kontrol geçti');
