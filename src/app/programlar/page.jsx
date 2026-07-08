// PROGRAMLAR — katalog SSR portu (piksel referansı: ProgramlarView.dc.html; içerik = PageContent 'programlar').
// İki ürün: AstroPen (ücretsiz) ve Hermes (ön satış). Detaylar /programlar/astropen & /programlar/hermes.
import { getContent } from '@/lib/content';
import { PROGRAMLAR } from '@/lib/defaults';
import { SITE, ORG, WEBSITE, priceNum, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle } from '@/components/Chrome';

export const revalidate = 300;

const URL_ = SITE + '/programlar';
const load = () => getContent('programlar', PROGRAMLAR);

export async function generateMetadata() {
  const c = await load();
  const seo = c.seo || {};
  return pageMeta({ title: seo.title || PROGRAMLAR.seo.title, description: seo.description || PROGRAMLAR.seo.description, path: '/programlar' });
}

function buildJsonLd(c) {
  const products = (c.products || []).map((p, i) => {
    const num = priceNum(p.price);
    return { '@type': 'ListItem', position: i + 1, item: {
      '@type': 'SoftwareApplication', name: p.name, applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Windows, macOS', description: p.tagline,
      url: SITE + p.href,
      offers: { '@type': 'Offer', price: num || '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' }
    } };
  });
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': URL_ + '#webpage', url: URL_, name: (c.seo && c.seo.title) || PROGRAMLAR.seo.title, description: (c.seo && c.seo.description) || PROGRAMLAR.seo.description, isPartOf: { '@id': SITE + '/#site' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Programlar', item: URL_ }
    ] },
    { '@type': 'ItemList', name: 'Astroloji programları', itemListElement: products }
  ] };
}

export default async function Programlar() {
  const c = await load();
  const hero = c.hero || {};
  const presale = c.presale || {};

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active="/programlar" />

      {/* HERO */}
      <section style={{ ...sectionStyle, paddingTop: 60 }}>
        <div style={kickerStyle}>{hero.kicker}</div>
        <h1 style={h1Style}>{hero.titleA}<span style={{ color: T.purple, fontStyle: 'italic' }}>{hero.titleEm}</span></h1>
        <p style={pStyle}>{hero.paragraph}</p>
      </section>

      {/* ÜRÜN KARTLARI */}
      <section style={{ ...sectionStyle, paddingTop: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
          {(c.products || []).map((p, i) => (
            <div key={i} style={{ background: p.paid ? T.cream : '#FFFFFF', border: `1px solid ${T.border}`, borderRadius: 22, padding: '28px 26px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'inline-block', alignSelf: 'flex-start', background: p.paid ? T.purple : T.dark, color: '#F5F1E6', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', borderRadius: 999, padding: '5px 12px' }}>{p.badge}</div>
              <h2 style={{ fontFamily: T.serif, fontWeight: 560, fontSize: 28, margin: '16px 0 0' }}>{p.name}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: T.ink2, margin: '10px 0 0' }}>{p.tagline}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'grid', gap: 9 }}>
                {(p.features || []).map((f, fi) => (
                  <li key={fi} style={{ fontSize: 14.5, color: T.ink2, paddingLeft: 22, position: 'relative' }}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: 0, color: T.purple }}>✳</span>{f}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 600 }}>{p.price}</span>
                {p.oldPrice ? <span style={{ color: T.muted, textDecoration: 'line-through', fontSize: 17 }}>{p.oldPrice}</span> : null}
              </div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{p.priceNote}</div>
              <div style={{ marginTop: 22 }}>
                <a href={p.href} style={{ background: p.paid ? T.dark : '#FFFFFF', color: p.paid ? '#F5F1E6' : T.ink, border: p.paid ? 'none' : `1px solid ${T.border}`, borderRadius: 999, padding: '13px 26px', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>İncele →</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ÖN SATIŞ ŞERİDİ */}
      <section style={sectionStyle}>
        <div style={{ background: T.dark, color: '#F5F1E6', borderRadius: 24, padding: '40px 36px' }}>
          <div style={{ ...kickerStyle, color: '#A7A296' }}>{presale.kicker}</div>
          <h2 style={{ fontFamily: T.serif, fontWeight: 520, fontSize: 'clamp(24px, 3vw, 34px)', margin: '10px 0 0' }}>{presale.title}</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: '#D8D2C2', margin: '12px 0 0', maxWidth: 640 }}>{presale.paragraph}</p>
          <div style={{ marginTop: 22 }}><a href="/programlar/hermes" style={{ background: T.purple, color: '#FFFFFF', borderRadius: 999, padding: '14px 28px', textDecoration: 'none', fontWeight: 600 }}>{presale.btn}</a></div>
        </div>
      </section>

      {/* KARŞILAŞTIRMA */}
      <section style={{ ...sectionStyle, paddingBottom: 8 }}>
        <p style={{ ...pStyle, fontStyle: 'italic', color: T.muted, maxWidth: 720 }}>{c.compare}</p>
      </section>

      <Footer />
    </main>
  );
}
