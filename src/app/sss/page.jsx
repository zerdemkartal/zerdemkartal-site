// SSS — kapsamlı soru/cevap (H1; GEO açısından en değerli sayfa: AI motorları FAQ'ları alıntılar).
// İçerik: 'hermes_site' → sss. JSON-LD: FAQPage (tam liste) + WebPage + Breadcrumb.
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle } from '@/components/Chrome';

export const revalidate = 300;
const PATH = '/sss';

export async function generateMetadata() {
  const c = await getHermes();
  return pageMeta({ ...c.seo.sss, path: PATH });
}

function buildJsonLd(c) {
  const seo = c.seo.sss;
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': SITE + PATH + '#webpage', url: SITE + PATH, name: seo.title, description: seo.description, inLanguage: 'tr-TR', isPartOf: { '@id': SITE + '/#site' }, about: { '@id': SITE + '/#hermes' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'SSS', item: SITE + PATH }
    ] },
    { '@type': 'FAQPage', mainEntity: (c.sss.items || []).map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }
  ] };
}

export default async function Sss() {
  const c = await getHermes();
  const { hero, items } = c.sss;

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active={PATH} />

      <section style={{ ...sectionStyle, paddingTop: 64 }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
          <div style={kickerStyle}>{hero.kicker}</div>
          <h1 style={h1Style}>{hero.title}</h1>
          <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }}>{hero.p}</p>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={{ maxWidth: 820 }}>
          {(items || []).map((q, i) => (
            <details key={i} style={{ borderBottom: `1px solid ${T.border}`, padding: '18px 4px' }}>
              <summary style={{ fontFamily: T.serif, fontSize: 19, cursor: 'pointer' }}>{q.q}</summary>
              <p style={{ ...pStyle, fontSize: 15.5 }}>{q.a}</p>
            </details>
          ))}
        </div>
        <p style={{ marginTop: 26 }}><a href="/iletisim">Sorun cevapsız kaldıysa yaz →</a></p>
      </section>

      <Footer />
    </main>
  );
}
