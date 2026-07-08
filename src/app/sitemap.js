import { prisma } from '@/lib/db';

// sitemap.xml — dinamik (FAZLAR §2.7). Statik sayfalar + yayındaki blog yazıları +
// danışmanlık analiz derin linkleri. Kural: yalnız 200 dönen, canonical, indekslenebilir URL'ler.
const SITE = (process.env.SITE_URL || 'https://zerdemkartal.com').replace(/\/$/, '');

// DanismanlikView._slugify portu (TR karakter haritası + & → ' ve ')
const TRMAP = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u' };
const slugify = (s) => String(s || '')
  .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (ch) => TRMAP[ch] || ch)
  .toLowerCase().replace(/&/g, ' ve ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const STATIC = [
  ['', 1.0, 'weekly'],
  ['/danismanliklar', 0.9, 'weekly'],
  ['/programlar', 0.8, 'monthly'],
  ['/programlar/astropen', 0.7, 'monthly'],
  ['/programlar/hermes', 0.7, 'monthly'],
  ['/astroloji-101', 0.8, 'weekly'],
  ['/blog', 0.7, 'daily'],
  ['/dogum-haritasi', 0.7, 'monthly'],
  ['/hakkimda', 0.5, 'yearly'],
  ['/iletisim', 0.5, 'yearly'],
  ['/yasal/kvkk', 0.2, 'yearly'],
  ['/yasal/gizlilik', 0.2, 'yearly'],
  ['/yasal/mesafeli-satis', 0.2, 'yearly'],
  ['/yasal/iade', 0.2, 'yearly']
];

export default async function sitemap() {
  const urls = STATIC.map(([p, priority, changeFrequency]) => ({
    url: SITE + p, priority, changeFrequency, lastModified: new Date()
  }));

  // Yayındaki blog yazıları — temiz URL /blog/yazi/<id> (Blog.dc.html #/yazi deseninin deploy karşılığı)
  const pages = await prisma.blogNode.findMany({
    where: { type: 'page', status: 'published' },
    select: { id: true, updatedAt: true }
  });
  for (const p of pages) {
    urls.push({ url: `${SITE}/blog/yazi/${p.id}`, priority: 0.6, changeFrequency: 'monthly', lastModified: p.updatedAt });
  }

  // Analiz derin linkleri — DanismanlikView._analizSlugs ile aynı sıra + tekilleştirme
  const dan = await prisma.pageContent.findUnique({ where: { key: 'danismanlik' } });
  const groups = dan?.data?.analiz?.groups || [];
  const seen = new Set();
  groups.forEach((g, gi) => (g.items || []).forEach((a, ci) => {
    const base = slugify(a.n) || `analiz-${gi}-${ci}`;
    let s = base, k = 2;
    while (seen.has(s)) s = `${base}-${k++}`;
    seen.add(s);
    urls.push({ url: `${SITE}/danismanliklar/analiz/${s}`, priority: 0.6, changeFrequency: 'monthly', lastModified: dan.updatedAt });
  }));

  return urls;
}
