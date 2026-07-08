// DOĞUM HARİTASI — SSR kabuk (piksel referansı: Dogum Haritasi.dc.html; içerik = PageContent 'harita').
// Çark/hesap aracı tamamen istemci tarafıdır (circular-natal-horoscope-js + SVG çizimi) →
// HaritaAraci.jsx 'use client' bileşenine port edilir; SSR burada meta + JSON-LD + hero'yu basar.
import { getContent } from '@/lib/content';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle } from '@/components/Chrome';
import HaritaAraci from './HaritaAraci';

export const revalidate = 300;

const URL_ = SITE + '/dogum-haritasi';
const SEO_DEF = {
  title: 'Ücretsiz Doğum Haritası Hesapla — Çark, Tablo, Türkçe Yorum | zerdemkartal',
  description: 'Doğum tarihini, saatini ve yerini gir; doğum haritası çarkın, gezegen–burç–ev tabloların ve kısa Türkçe yorumun saniyeler içinde hazır. Ücretsiz.'
};

const load = () => getContent('harita', {});

export async function generateMetadata() {
  const c = await load();
  const seo = c.seo || {};
  return pageMeta({ title: seo.title || SEO_DEF.title, description: seo.description || SEO_DEF.description, path: '/dogum-haritasi' });
}

export default async function DogumHaritasi() {
  const c = await load();
  const hero = c.hero || {};
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebApplication', '@id': URL_ + '#app', name: 'Doğum Haritası Aracı', url: URL_, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', description: (c.seo && c.seo.description) || SEO_DEF.description, offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }, publisher: { '@id': SITE + '/#org' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Doğum Haritası', item: URL_ }
    ] }
  ] };

  return (
    <main>
      <JsonLd data={jsonld} />
      <Nav active="/dogum-haritasi" />

      <section style={{ ...sectionStyle, paddingTop: 64 }}>
        <div style={kickerStyle}>{hero.kicker || 'ÜCRETSİZ ARAÇ'}</div>
        <h1 style={h1Style}>
          <span style={{ color: T.muted }}>{hero.gri || 'Gökyüzü doğduğun an '}</span>
          <span>{hero.siyah || 'nasıldı?'}</span>
        </h1>
        <p style={pStyle}>{hero.p || 'Tarih, saat ve yer — çarkın, gezegen tabloların ve kısa Türkçe yorumun saniyeler içinde hazır.'}</p>
        {c.formNot && <p style={{ ...pStyle, fontSize: 14, color: T.muted }}>{c.formNot}</p>}
      </section>

      <section style={sectionStyle}>
        <HaritaAraci />
      </section>

      <Footer />
    </main>
  );
}
