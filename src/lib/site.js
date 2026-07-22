// Ortak site sabitleri + SEO/GEO yardımcıları — HERMES sitesi (H1 dönüşümü).
// Alan adı henüz kesinleşmedi → SITE_URL env ile değişir (docs/HERMES-SITE-PLANI.md "Açık konular").
export const SITE = (process.env.SITE_URL || 'https://hermesastroloji.com').replace(/\/$/, '');
export const OG_IMAGE = SITE + '/assets/og-image.png';
export const LOGO = SITE + '/assets/hermes-mark.svg';

// Site seviyesi JSON-LD düğümleri. Yayıncı = zerdemkartal (kişi/atölye), ürün & site = Hermes.
export const ORG = {
  '@type': 'Organization', '@id': SITE + '/#org', name: 'zerdemkartal', url: SITE + '/', logo: LOGO,
  description: 'Hermes astroloji programını geliştiren bağımsız astroloji atölyesi.',
  sameAs: ['https://instagram.com/zerdemkartal', 'https://youtube.com/@zerdemkartal']
};
export const WEBSITE = {
  '@type': 'WebSite', '@id': SITE + '/#site', url: SITE + '/', name: 'Hermes',
  alternateName: 'Hermes Astroloji Programı',
  inLanguage: 'tr-TR', publisher: { '@id': SITE + '/#org' }
};

/** Ürünün tek gerçek JSON-LD düğümü — her sayfa aynı @id'yi kullanır (GEO: tutarlı varlık).
 *  featureList çağıran sayfadan gelir (içerik modelinden). Uydurma puan/yorum YOK. */
export function appNode({ description, featureList = [], price = '3000' } = {}) {
  return {
    '@type': 'SoftwareApplication', '@id': SITE + '/#hermes', name: 'Hermes',
    alternateName: 'Hermes Astroloji Programı',
    operatingSystem: 'Windows 10/11 (64-bit)', applicationCategory: 'LifestyleApplication',
    inLanguage: 'tr', description, featureList,
    publisher: { '@id': SITE + '/#org' }, url: SITE + '/',
    offers: {
      '@type': 'Offer', price, priceCurrency: 'TRY',
      availability: 'https://schema.org/PreOrder', url: SITE + '/fiyat'
    }
  };
}

export const priceNum = (p) => String(p || '').replace(/[^0-9]/g, '');

/** Next generateMetadata gövdesi — tam meta seti (title/desc/canonical/OG/Twitter). */
export function pageMeta({ title, description, path, ogType = 'website', noindex = false, image = OG_IMAGE }) {
  return {
    title, description,
    alternates: { canonical: SITE + path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: SITE + path, siteName: 'Hermes', locale: 'tr_TR', type: ogType, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] }
  };
}
