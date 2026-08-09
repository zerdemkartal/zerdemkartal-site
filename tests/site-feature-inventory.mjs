import assert from 'node:assert/strict';
import {
  HERMES_FEATURE_GROUPS,
  HERMES_FEATURE_METRICS,
  HERMES_FEATURE_SUMMARY,
  HERMES_HOME_FEATURE_CARDS,
  countHermesFeatures,
  migrateHermesFeatures
} from '../src/lib/hermesFeatures.mjs';

assert.equal(HERMES_FEATURE_GROUPS.length, 8, 'Ana çalışma alanı sayısı 8 olmalı');
assert.equal(countHermesFeatures(), 72, 'Çalışan araç ve özellik sayısı 72 olmalı');
assert.deepEqual(HERMES_FEATURE_METRICS, { alan: 8, ozellik: 72 });
assert.equal(HERMES_FEATURE_SUMMARY, '8 ana çalışma alanı · 72 çalışan araç ve özellik');
assert.equal(HERMES_HOME_FEATURE_CARDS.length, HERMES_FEATURE_METRICS.alan, 'Ana sayfa kartları envanter alanlarıyla eşleşmeli');

const ids = new Set();
const names = new Set();
for (const group of HERMES_FEATURE_GROUPS) {
  assert.ok(group.id && group.baslik && group.giris, 'Her çalışma alanı kimlik, başlık ve giriş taşımalı');
  assert.ok(!ids.has(group.id), `Tekrarlanan çalışma alanı kimliği: ${group.id}`);
  ids.add(group.id);
  assert.ok(group.gorsel?.src, `${group.baslik} için gerçek ürün görseli eksik`);
  for (const item of group.items || []) {
    assert.ok(item.ad && item.desc, `${group.baslik} içinde eksik özellik kaydı`);
    assert.ok(!names.has(item.ad), `Tekrarlanan özellik adı: ${item.ad}`);
    names.add(item.ad);
  }
}

const publicInventoryText = JSON.stringify(HERMES_FEATURE_GROUPS);
for (const excluded of ['17 Ağustos 2026', 'Android', 'iPhone', 'iPad', 'senkronizasyon']) {
  assert.ok(!publicInventoryText.includes(excluded), `Yol haritası çalışan özellik sayısına girdi: ${excluded}`);
}

const legacy = {
  seo: { home: {}, ozellikler: {} },
  home: { moduller: { cards: [{ title: 'Doğum haritası & Zodyak' }] } },
  ozellikler: {
    hero: {},
    gruplar: [
      { id: 'motor', items: [{ ad: 'Doğum haritası' }] },
      { id: 'platform', items: [{ ad: 'Yol haritası' }] }
    ]
  }
};
const migrated = migrateHermesFeatures(legacy);
assert.equal(migrated.ozellikler.gruplar.length, 8, 'Eski canlı DB grupları yeni envantere taşınmalı');
assert.equal(countHermesFeatures(migrated.ozellikler.gruplar), 72, 'Eski canlı DB sayımı 72 araca taşınmalı');
assert.equal(migrated.home.moduller.cards.length, 8, 'Eski ana sayfa kartları sekiz alana taşınmalı');

console.log('site özellik envanteri: 8 alan / 72 araç doğrulandı');
