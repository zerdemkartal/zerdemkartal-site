// Ortak site sabitleri + SEO yardımcıları (SSR port — FAZLAR §2.7)
export const SITE = (process.env.SITE_URL || 'https://zerdemkartal.com').replace(/\/$/, '');
export const OG_IMAGE = SITE + '/assets/og-image.png';
export const LOGO = SITE + '/assets/logo-transparent.png';

// Site seviyesi JSON-LD düğümleri (prototipteki @id'lerle birebir)
export const ORG = {
  '@type': 'Organization', '@id': SITE + '/#org', name: 'zerdemkartal', url: SITE + '/', logo: LOGO,
  description: 'Gökyüzünü senin dilinde okuyan astroloji stüdyosu; AstroPen masaüstü programı, birebir danışmanlık ve eğitimler.',
  sameAs: ['https://instagram.com/zerdemkartal', 'https://youtube.com/@zerdemkartal', 'https://open.spotify.com/user/zerdemkartal']
};
export const WEBSITE = {
  '@type': 'WebSite', '@id': SITE + '/#site', url: SITE + '/', name: 'zerdemkartal',
  inLanguage: 'tr-TR', publisher: { '@id': SITE + '/#org' }
};

export const priceNum = (p) => String(p || '').replace(/[^0-9]/g, '');

// DanismanlikView._slugify portu (TR karakter haritası + & → ' ve ')
const TRMAP = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u' };
export const slugify = (s) => String(s || '')
  .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (ch) => TRMAP[ch] || ch)
  .toLowerCase().replace(/&/g, ' ve ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// DanismanlikView._analizSlugs portu — doküman sırası + tekilleştirme
export function analizSlugs(c) {
  const out = []; const seen = {};
  ((c && c.analiz && c.analiz.groups) || []).forEach((g, gi) => (g.items || []).forEach((a, ci) => {
    const base = slugify(a.n) || `analiz-${gi}-${ci}`;
    let s = base, k = 2;
    while (seen[s]) s = `${base}-${k++}`;
    seen[s] = 1;
    out.push({ gi, ci, slug: s, a, cat: g.cat });
  }));
  return out;
}

/** Next generateMetadata gövdesi — tam meta seti (title/desc/canonical/OG/Twitter). */
export function pageMeta({ title, description, path, ogType = 'website', noindex = false, image = OG_IMAGE }) {
  return {
    title, description,
    alternates: { canonical: SITE + path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: SITE + path, siteName: 'zerdemkartal', locale: 'tr_TR', type: ogType, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] }
  };
}
