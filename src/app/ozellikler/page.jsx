// ÖZELLİKLER — modül modül Hermes (H1). İçerik: 'hermes_site' → ozellikler.
// Her grup #<id> çapasıyla derin linklenebilir (GEO: bölüm bazlı adreslenebilirlik).
// JSON-LD: WebPage + Breadcrumb + SoftwareApplication (tam featureList) + ItemList.
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, appNode, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, h2Style, pStyle, sectionStyle, cardStyle } from '@/components/Chrome';

export const revalidate = 300;
const PATH = '/ozellikler';

export async function generateMetadata() {
  const c = await getHermes();
  return pageMeta({ ...c.seo.ozellikler, path: PATH });
}

function buildJsonLd(c) {
  const seo = c.seo.ozellikler;
  const feats = (c.ozellikler.gruplar || []).flatMap((g) => (g.items || []).map((x) => x.ad));
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': SITE + PATH + '#webpage', url: SITE + PATH, name: seo.title, description: seo.description, inLanguage: 'tr-TR', isPartOf: { '@id': SITE + '/#site' }, about: { '@id': SITE + '/#hermes' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Özellikler', item: SITE + PATH }
    ] },
    appNode({ description: seo.description, featureList: feats }),
    { '@type': 'ItemList', name: 'Hermes modülleri', itemListElement: (c.ozellikler.gruplar || []).map((g, i) => ({
      '@type': 'ListItem', position: i + 1, name: g.baslik, url: SITE + PATH + '#' + g.id
    })) }
  ] };
}

export default async function Ozellikler() {
  const c = await getHermes();
  const oz = c.ozellikler;

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active={PATH} />

      <section style={{ ...sectionStyle, paddingTop: 64 }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
          <div style={kickerStyle}>{oz.hero.kicker}</div>
          <h1 style={h1Style}>{oz.hero.title}</h1>
          <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }}>{oz.hero.p}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24, justifyContent: 'center' }}>
          {(oz.gruplar || []).map((g) => (
            <a key={g.id} href={'#' + g.id} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 999, padding: '8px 16px', fontSize: 13.5, color: T.ink2, textDecoration: 'none' }}>{g.baslik}</a>
          ))}
        </div>
      </section>

      {(oz.gruplar || []).map((g) => (
        <section key={g.id} id={g.id} style={sectionStyle}>
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
            <h2 style={h2Style}>{g.baslik}</h2>
            <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }}>{g.giris}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 18, marginTop: 26 }}>
            {(g.items || []).map((x, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontFamily: T.serif, fontSize: 19 }}>{x.ad}</div>
                <p style={{ ...pStyle, fontSize: 14.5, marginTop: 8 }}>{x.desc}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section style={sectionStyle}>
        <div style={{ background: T.dark, color: 'var(--h-dark-text)', borderRadius: 28, padding: '48px 44px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ ...h2Style, color: 'var(--h-dark-wordmark)', margin: 0 }}>Hepsi tek lisansta.</h2>
            <p style={{ ...pStyle, color: 'var(--h-dark-text2)' }}>Modül modül satış yok; Hermes’i aldığında bu sayfadaki her şey senindir.</p>
          </div>
          <a href="/fiyat" style={{ background: 'var(--h-dark-wordmark)', color: T.dark, borderRadius: 999, padding: '15px 30px', textDecoration: 'none', fontWeight: 700 }}>Fiyatı gör</a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
