import { prisma } from '@/lib/db';

// sitemap.xml — HERMES sitesi (H1). Statik sayfalar + yayındaki blog yazıları.
// Kural: yalnız 200 dönen, canonical, indekslenebilir URL'ler (/uye noindex olduğundan girmez).
const SITE = (process.env.SITE_URL || 'https://hermesastroloji.com').replace(/\/$/, '');

const STATIC = [
  ['', 1.0, 'weekly'],
  ['/ozellikler', 0.9, 'monthly'],
  ['/fiyat', 0.9, 'monthly'],
  ['/indir', 0.8, 'monthly'],
  ['/sss', 0.8, 'monthly'],
  ['/blog', 0.7, 'daily'],
  ['/hakkimda', 0.4, 'yearly'],
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

  // Yayındaki blog yazıları — temiz URL /blog/yazi/<id>
  try {
    const pages = await prisma.blogNode.findMany({
      where: { type: 'page', status: 'published' },
      select: { id: true, updatedAt: true }
    });
    for (const p of pages) {
      urls.push({ url: `${SITE}/blog/yazi/${p.id}`, priority: 0.6, changeFrequency: 'monthly', lastModified: p.updatedAt });
    }
  } catch { /* DB yoksa statik liste yeter */ }

  return urls;
}
