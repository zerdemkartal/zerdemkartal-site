// FİYAT — tek lisans, her platform (H1). İçerik: 'hermes_site' → fiyat.
// CTA şimdilik /iletisim (ön sipariş); ödeme H2'de POST /api/orders akışına bağlanır.
// JSON-LD: WebPage + Breadcrumb + SoftwareApplication(Offer) + FAQPage (fiyat SSS).
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, appNode, pageMeta, priceNum } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, h2Style, pStyle, sectionStyle, btnPrimary } from '@/components/Chrome';
import OnSiparis from './OnSiparis';

export const revalidate = 300;
const PATH = '/fiyat';

export async function generateMetadata() {
  const c = await getHermes();
  return pageMeta({ ...c.seo.fiyat, path: PATH });
}

function buildJsonLd(c) {
  const seo = c.seo.fiyat;
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': SITE + PATH + '#webpage', url: SITE + PATH, name: seo.title, description: seo.description, inLanguage: 'tr-TR', isPartOf: { '@id': SITE + '/#site' }, about: { '@id': SITE + '/#hermes' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Fiyat', item: SITE + PATH }
    ] },
    appNode({ description: seo.description, price: priceNum(c.fiyat.kutu.price) || '3000' }),
    { '@type': 'FAQPage', mainEntity: (c.fiyat.sss || []).map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }
  ] };
}

export default async function Fiyat() {
  const c = await getHermes();
  const { hero, kutu, tekLisans, sss } = c.fiyat;

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active={PATH} />

      <section style={{ ...sectionStyle, paddingTop: 64 }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
          <div style={kickerStyle} data-he data-path="fiyat.hero.kicker">{hero.kicker}</div>
          <h1 style={h1Style} data-he data-path="fiyat.hero.title">{hero.title}</h1>
          <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }} data-he data-path="fiyat.hero.p">{hero.p}</p>
        </div>
      </section>

      <section style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 26, alignItems: 'start', maxWidth: 1160 }}>
        {/* FİYAT KUTUSU */}
        <div style={{ background: T.card, border: `1.5px solid ${T.purple}`, borderRadius: 22, padding: '34px 34px 38px' }}>
          <div style={{ ...kickerStyle, color: T.accentText }} data-he data-path="fiyat.kutu.kicker">{kutu.kicker}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 12 }}>
            <span style={{ fontFamily: T.serif, fontSize: 46 }} data-he data-path="fiyat.kutu.price">{kutu.price}</span>
            {kutu.oldPrice && <s style={{ color: T.muted, fontSize: 20 }} data-he data-path="fiyat.kutu.oldPrice">{kutu.oldPrice}</s>}
          </div>
          <ul style={{ ...pStyle, fontSize: 14.5, paddingLeft: 20 }}>
            {(kutu.rows || []).map((r, i) => <li key={i} style={{ listStyle: 'none', marginLeft: -20 }} data-he data-path={`fiyat.kutu.rows.${i}`}>{r}</li>)}
          </ul>
          <div style={{ color: T.muted, fontSize: 13.5, marginTop: 14 }} data-he data-path="fiyat.kutu.alt">{kutu.alt}</div>
          <OnSiparis label={kutu.btn} price={Number(priceNum(kutu.price)) || 3000} />
        </div>

        {/* TEK LİSANS HER PLATFORM */}
        <div style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 22, padding: '34px 34px 38px' }}>
          <h2 style={{ ...h2Style, fontSize: 26, margin: 0 }} data-he data-path="fiyat.tekLisans.title">{tekLisans.title}</h2>
          <p style={{ ...pStyle, fontSize: 15 }} data-he data-path="fiyat.tekLisans.p">{tekLisans.p}</p>
          <ul style={{ ...pStyle, fontSize: 14.5, paddingLeft: 20 }}>
            {(tekLisans.rows || []).map((r, i) => <li key={i} data-he data-path={`fiyat.tekLisans.rows.${i}`}>{r}</li>)}
          </ul>
        </div>
      </section>

      {(sss || []).length > 0 && (
        <section style={sectionStyle}>
          <h2 style={{ ...h2Style, textAlign: 'center' }}>Fiyat hakkında sorular</h2>
          <div style={{ marginTop: 22, maxWidth: 780 }}>
            {sss.map((q, i) => (
              <details key={i} style={{ borderBottom: `1px solid ${T.border}`, padding: '16px 4px' }}>
                <summary style={{ fontFamily: T.serif, fontSize: 18, cursor: 'pointer' }} data-he data-path={`fiyat.sss.${i}.q`}>{q.q}</summary>
                <p style={{ ...pStyle, fontSize: 15 }} data-he data-path={`fiyat.sss.${i}.a`}>{q.a}</p>
              </details>
            ))}
          </div>
          <p style={{ marginTop: 20 }}><a href="/sss">Tüm sık sorulanlar →</a></p>
        </section>
      )}

      <Footer />
    </main>
  );
}
