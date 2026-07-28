// sitemap.xml — HERMES sitesi (H1). Yalnız kamusal ve indekslenebilir sayfalar.
// Kural: yalnız 200 dönen, canonical, indekslenebilir URL'ler (/uye noindex olduğundan girmez).
const SITE = (process.env.SITE_URL || 'https://hermesastroloji.com').replace(/\/$/, '');

const STATIC = [
  ['', 1.0, 'weekly'],
  ['/ozellikler', 0.9, 'monthly'],
  ['/fiyat', 0.9, 'monthly'],
  ['/satin-al', 0.8, 'monthly'],
  ['/indir', 0.8, 'monthly'],
  ['/sss', 0.8, 'monthly'],
  ['/hakkimda', 0.4, 'yearly'],
  ['/iletisim', 0.5, 'yearly'],
  ['/yasal/kvkk', 0.2, 'yearly'],
  ['/yasal/gizlilik', 0.2, 'yearly'],
  ['/yasal/mesafeli-satis', 0.2, 'yearly'],
  ['/yasal/iade', 0.2, 'yearly']
];

export default async function sitemap() {
  return STATIC.map(([p, priority, changeFrequency]) => ({
    url: SITE + p, priority, changeFrequency, lastModified: new Date()
  }));
}
