import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const page = fs.readFileSync(path.join(root, 'src/app/ucretsiz-programlar/page.jsx'), 'utf8');
const data = fs.readFileSync(path.join(root, 'src/lib/freePrograms.js'), 'utf8');
const chrome = fs.readFileSync(path.join(root, 'src/components/Chrome.jsx'), 'utf8');

assert.match(page, /<Nav active=\{PATH\}/, 'Sayfa ortak navigasyonu kullanmalı');
assert.match(page, /aria-disabled="true"/, 'Hazır olmayan indirme görünür ve erişilebilir kalmalı');
assert.match(data, /ASTEROID_HELPER_DISTRIBUTION_CLEARED === '1'/, 'Asteroid indirmesi lisans kapısı olmadan açılamaz');
assert.match(data, /ASTROPEN_PUBLIC_DOWNLOAD_URL/, 'AstroPen bağlantısı ortam değişkeninden gelmeli');
assert.match(chrome, /\/ucretsiz-programlar/, 'Ücretsiz programlar ana gezinmede bulunmalı');

console.log('Ücretsiz programlar sayfa sözleşmesi: OK');
