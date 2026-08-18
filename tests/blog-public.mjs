import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
let passed = 0;

function check(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
}

const indexPage = read('src/app/blog/page.jsx');
const articlePage = read('src/app/blog/yazi/[id]/page.jsx');
const content = read('src/content/blogArticles.js');
const data = read('src/lib/blogData.js');
const explorer = read('src/app/blog/BlogExplorer.jsx');
const chrome = read('src/components/Chrome.jsx');
const mobile = read('src/components/MobileNav.jsx');
const palette = read('src/components/CommandPalette.jsx');
const robots = read('src/app/robots.js');
const sitemap = read('src/app/sitemap.js');
const llms = read('src/app/llms.txt/route.js');

check('blog indeksindeki 404 perdesi kaldırıldı', () => {
  assert.doesNotMatch(indexPage, /notFound\s*\(/);
  assert.doesNotMatch(indexPage, /noindex:\s*true/);
});

check('yazı rotası yalnız bulunamayan içeriği 404 yapıyor', () => {
  assert.match(articlePage, /if \(!p\) notFound\(\)/);
  assert.match(articlePage, /ogType:\s*'article'/);
});

check('ilk yazının kalıcı ve okunabilir adresi var', () => {
  assert.match(content, /astroloji-programi-nedir-nasil-secilir/);
  assert.match(content, /title: 'Astroloji Programı Nedir, Nasıl Seçilir\?'/);
});

check('ilk yazı tarih, özet ve SEO alanlarını taşıyor', () => {
  assert.match(content, /date: '2026-08-18'/);
  assert.match(content, /seo:\s*\{/);
  assert.match(content, /description:/);
});

check('ilk yazı tam uzunlukta bir makale', () => {
  const md = content.match(/md: `([\s\S]*?)`\s*\n\s*\}/)?.[1] || '';
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 850, `beklenen en az 850 kelime, bulunan ${words}`);
  assert.match(md, /## Doğru astroloji programı nasıl seçilir\?/);
  assert.match(md, /\[Hermes\]\(\/ozellikler\)/);
});

check('kamusal yayın kapısı tarih, içerik ve published durumu istiyor', () => {
  assert.match(data, /row\.status !== 'draft'/);
  assert.match(data, /\\d\{4\}-\\d\{2\}-\\d\{2\}/);
  assert.match(data, /row\.body \|\| row\.md/);
});

check('hazırlık kütüphanesi kamusal kaynağa bağlanmıyor', () => {
  assert.doesNotMatch(data, /seed-data\/library\.json/);
  assert.match(data, /PUBLIC_BLOG_TREE/);
});

check('masaüstü, mobil, alt menü ve arama blogu gösteriyor', () => {
  assert.match(chrome, /\['\/blog', 'Blog'\]/);
  assert.match(chrome, /href="\/blog">Blog/);
  assert.match(mobile, /\['\/blog', 'Blog'\]/);
  assert.match(palette, /h: '\/blog'/);
});

check('robots blogu taramaya kapatmıyor', () => {
  const disallow = robots.match(/disallow:\s*\[([^\]]*)\]/)?.[1] || '';
  assert.doesNotMatch(disallow, /['"]\/blog['"]/);
});

check('sitemap blog indeksini ve yazıları üretiyor', () => {
  assert.match(sitemap, /\['\/blog', 0\.8, 'weekly'\]/);
  assert.match(sitemap, /\/blog\/yazi\/\$\{article\.id\}/);
});

check('llms.txt blogu ve yayınlanmış yazıları listeliyor', () => {
  assert.match(llms, /## Blog yazıları/);
  assert.match(llms, /publishedBlogRows/);
});

check('geçici görsel etiketi kamusal blogdan kaldırıldı', () => {
  assert.doesNotMatch(explorer, /görsel · sonra eklenecek/i);
});

console.log(`\nBlog kamusal yayın kapısı: ${passed}/${passed} geçti.`);
