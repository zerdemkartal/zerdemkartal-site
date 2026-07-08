// ASTROLOJİ 101 — SSR portu (piksel referansı: Astroloji101View.dc.html; içerik = PageContent 'astroloji101').
// İnteraktif çalışma modları (flash kart / SRS / test / eşleştir / seviye) istemci işidir; SSR sürüm
// tüm deste + kart içeriğini crawlable metin olarak basar (Egitimler.dc.html'deki Course/ItemList JSON-LD portu).
import { getContent } from '@/lib/content';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle } from '@/components/Chrome';

export const revalidate = 300;

const URL_ = SITE + '/astroloji-101';
const SEO_DEF = {
  title: 'Astroloji 101 — Flash Kartlarla Astroloji Çalış | zerdemkartal',
  description: 'Burçları, gezegenleri, evleri ve açıları flash kart, aralıklı tekrar (SRS), test ve eşleştirme oyunuyla ücretsiz çalış. Seviye testiyle nereden başlayacağını öğren.'
};

const load = () => getContent('astroloji101', {});

export async function generateMetadata() {
  const c = await load();
  const seo = c.seo || {};
  return pageMeta({ title: seo.title || SEO_DEF.title, description: seo.description || SEO_DEF.description, path: '/astroloji-101' });
}

function buildJsonLd(c) {
  const decks = c.decks || [];
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': URL_ + '#webpage', url: URL_, name: (c.seo && c.seo.title) || SEO_DEF.title, description: (c.seo && c.seo.description) || SEO_DEF.description, isPartOf: { '@id': SITE + '/#site' }, breadcrumb: { '@id': URL_ + '#breadcrumb' } },
    { '@type': 'BreadcrumbList', '@id': URL_ + '#breadcrumb', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Astroloji 101', item: URL_ }
    ] },
    { '@type': 'Course', name: 'Astroloji 101', description: 'Gökyüzünün alfabesini kendi hızında çalış: burçlar, gezegenler, evler, açılar, elementler ve asaletler. Flash kartlar ve aralıklı tekrar (SRS) ile kalıcı öğrenme.', provider: { '@id': SITE + '/#org' }, isAccessibleForFree: true, educationalLevel: 'Beginner', inLanguage: 'tr', offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }, hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT10M' } },
    { '@type': 'ItemList', name: 'Astroloji 101 konuları', itemListElement: decks.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.title, description: d.blurb })) }
  ] };
}

export default async function Astroloji101() {
  const c = await load();
  const hero = c.hero || {};

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active="/astroloji-101" />

      <section style={{ ...sectionStyle, paddingTop: 64 }}>
        <div style={kickerStyle}>{hero.kicker || 'ASTROLOJİ 101'}</div>
        <h1 style={h1Style}>{hero.titleA || 'Gökyüzünün'} <span style={{ color: T.muted }}>{hero.titleB || 'alfabesini çalış'}</span></h1>
        <p style={pStyle}>{hero.subtitle}</p>
        <p style={{ ...pStyle, fontSize: 14.5, color: T.muted }}>Flash kart, aralıklı tekrar, test ve eşleştirme modları tarayıcıda çalışır; ilerlemen hesabına kaydedilir.</p>
      </section>

      {(c.decks || []).map((d, di) => (
        <section key={di} style={sectionStyle}>
          <h2 style={{ fontFamily: T.serif, fontWeight: 470, fontSize: 30, margin: 0 }}>
            <span aria-hidden="true" style={{ marginRight: 10 }}>{d.glyph}</span>{d.title}
          </h2>
          <p style={{ ...pStyle, fontSize: 15, marginTop: 8 }}>{d.blurb}</p>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginTop: 22 }}>
            {(d.cards || []).map((k, ki) => (
              <div key={ki} style={{ background: '#FFFFFF', border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 20px' }}>
                <dt style={{ fontFamily: T.serif, fontSize: 19 }}>
                  <span aria-hidden="true" style={{ marginRight: 8, color: d.ink || T.purple }}>{k.q}</span>
                  {k.blog ? <a href={`/blog/yazi/${k.blog}`} style={{ color: T.ink, textDecoration: 'none' }}>{k.name}</a> : k.name}
                </dt>
                <dd style={{ margin: '8px 0 0', fontSize: 14.5, color: T.ink2 }}>{k.a}</dd>
                {k.hint && <dd style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>{k.hint}</dd>}
              </div>
            ))}
          </dl>
        </section>
      ))}

      <Footer />
    </main>
  );
}
