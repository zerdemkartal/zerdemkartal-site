// sitemap.xml — HERMES sitesi (H1). Yalnız kamusal ve indekslenebilir sayfalar.
// Kural: yalnız 200 dönen, canonical, indekslenebilir URL'ler (/uye noindex olduğundan girmez).
import { prisma } from '@/lib/db';
import { publishedBlogRows } from '@/lib/blogData';

const SITE = (process.env.SITE_URL || 'https://hermesastroloji.com').replace(/\/$/, '');

const STATIC = [
  ['', 1.0, 'weekly'],
  ['/ozellikler', 0.9, 'monthly'],
  ['/fiyat', 0.9, 'monthly'],
  ['/satin-al', 0.8, 'monthly'],
  ['/indir', 0.8, 'monthly'],
  ['/blog', 0.8, 'weekly'],
  ['/sss', 0.8, 'monthly'],
  ['/hakkimda', 0.4, 'yearly'],
  ['/iletisim', 0.5, 'yearly'],
  ['/yasal/kvkk', 0.2, 'yearly'],
  ['/yasal/gizlilik', 0.2, 'yearly'],
  ['/yasal/on-bilgilendirme', 0.2, 'yearly'],
  ['/yasal/teslimat', 0.2, 'yearly'],
  ['/yasal/mesafeli-satis', 0.2, 'yearly'],
  ['/yasal/iade', 0.2, 'yearly']
];

export default async function sitemap() {
  const databaseRows = await prisma.blogNode.findMany().catch(() => []);
  const articles = publishedBlogRows(databaseRows).filter((row) => row.type === 'page');

  return STATIC.map(([p, priority, changeFrequency]) => ({
    url: SITE + p, priority, changeFrequency, lastModified: new Date()
  })).concat(articles.map((article) => ({
    url: `${SITE}/blog/yazi/${article.id}`,
    priority: 0.7,
    changeFrequency: 'monthly',
    lastModified: new Date(`${article.date}T00:00:00Z`)
  })));
}
