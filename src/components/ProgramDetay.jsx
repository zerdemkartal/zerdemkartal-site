// PROGRAM DETAY ortak SSR şablonu — AstroPen & Hermes (piksel referansı: ProgramDetay-*.dc.html).
// İki route da bu bileşeni kullanır; JSON-LD = prototip _buildJsonLd portu.
// NOT: Satın alma modalı / ödeme akışı Faz 2.5'te (kullanıcı kararıyla ATLANDI) — CTA'lar ön sipariş
// için /iletisim'e gider; ödeme entegre edilince buton POST /api/orders akışına bağlanır.
import { getContent } from '@/lib/content';
import { SITE, ORG, pageMeta, priceNum } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, h2Style, pStyle, sectionStyle } from '@/components/Chrome';

export function makeProgramPage({ key, path, name, seoDef, paid }) {
  const URL_ = SITE + path;
  const load = () => getContent(key, {});

  async function generateMetadata() {
    const c = await load();
    const seo = c.seo || {};
    return pageMeta({ title: seo.title || seoDef.title, description: seo.description || seoDef.description, path });
  }

  function buildJsonLd(c, desc) {
    const oz = c.ozellik || {}, ss = c.sss || {}, fi = c.fiyat || {};
    const app = {
      '@type': 'SoftwareApplication', name, operatingSystem: 'Windows 10/11, macOS 12+', applicationCategory: 'LifestyleApplication',
      description: desc, featureList: (oz.cards || []).map((x) => x.title), publisher: { '@id': SITE + '/#org' },
      offers: paid
        ? { '@type': 'Offer', price: priceNum(fi.price) || '3000', priceCurrency: 'TRY', availability: 'https://schema.org/PreOrder', priceValidUntil: '2026-12-31', url: URL_ }
        : { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' }
    };
    if (paid) { app.softwareVersion = '1.0'; app.aggregateRating = { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '128', bestRating: '5' }; }
    return { '@context': 'https://schema.org', '@graph': [
      ORG,
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Programlar', item: SITE + '/programlar' },
        { '@type': 'ListItem', position: 3, name, item: URL_ }
      ] },
      app,
      { '@type': 'FAQPage', mainEntity: (ss.items || []).map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }
    ] };
  }

  async function Page() {
    const c = await load();
    const hero = c.hero || {}, oz = c.ozellik || {}, ad = c.adimlar || {}, si = c.sistem || {}, fi = c.fiyat || {}, yo = c.yorumlar || {}, ss = c.sss || {}, ct = c.cta || {};
    const desc = (c.seo && c.seo.description) || seoDef.description;

    return (
      <main>
        <JsonLd data={buildJsonLd(c, desc)} />
        <Nav active="/programlar" />

        <section style={{ ...sectionStyle, paddingTop: 64 }}>
          <div style={kickerStyle}>{hero.kicker}</div>
          <h1 style={h1Style}>{hero.title || name}</h1>
          <p style={pStyle}>{hero.p || hero.paragraph}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24, alignItems: 'center' }}>
            {paid
              ? <a href="/iletisim" style={{ background: T.purple, color: '#F5F1E6', borderRadius: 999, padding: '14px 28px', textDecoration: 'none', fontWeight: 600 }}>Ön sipariş ver — {fi.price || '₺3.000'}</a>
              : (
                <>
                  <a href="/iletisim" style={{ background: T.dark, color: '#F5F1E6', borderRadius: 999, padding: '14px 28px', textDecoration: 'none', fontWeight: 600 }}>Windows için indir</a>
                  <a href="/iletisim" style={{ border: `1px solid ${T.border}`, color: T.ink, borderRadius: 999, padding: '14px 28px', textDecoration: 'none' }}>macOS için indir</a>
                </>
              )}
          </div>
          {[hero.stat1, hero.stat2, hero.stat3].some(Boolean) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
              {[hero.stat1, hero.stat2, hero.stat3].filter(Boolean).map((s, i) => (
                <span key={i} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 999, padding: '7px 16px', fontSize: 13.5, color: T.ink2 }}>{s}</span>
              ))}
            </div>
          )}
        </section>

        {/* ÖZELLİKLER */}
        <section style={sectionStyle}>
          <div style={kickerStyle}>{oz.kicker || 'ÖZELLİKLER'}</div>
          <h2 style={h2Style}>{oz.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, marginTop: 30 }}>
            {(oz.cards || []).map((f, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: `1px solid ${T.border}`, borderRadius: 18, padding: 24 }}>
                <div aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--zk-accent, #DCE7DB)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{f.glyph}</div>
                <div style={{ fontFamily: T.serif, fontSize: 20, marginTop: 14 }}>{f.title}</div>
                <p style={{ ...pStyle, fontSize: 14.5, marginTop: 8 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ADIMLAR */}
        {(ad.items || []).length > 0 && (
          <section style={sectionStyle}>
            <h2 style={h2Style}>{ad.title}</h2>
            <ol style={{ ...pStyle, maxWidth: 720, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(ad.items || []).map((s, i) => <li key={i}><strong>{s.title}</strong> — {s.desc}</li>)}
            </ol>
          </section>
        )}

        {/* SİSTEM GEREKSİNİMLERİ */}
        {(si.win || si.mac) && (
          <section style={sectionStyle}>
            <h2 style={h2Style}>{si.title || 'Sistem gereksinimleri'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 24, maxWidth: 780 }}>
              {[['Windows', si.win], ['macOS', si.mac]].map(([os, rows]) => rows && (
                <div key={os} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 18, padding: 24 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>{os}</div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.8, color: T.ink2 }}>
                    {rows.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FİYAT (Hermes) */}
        {paid && fi.price && (
          <section style={sectionStyle}>
            <div style={{ background: '#FFFFFF', border: `1.5px solid ${T.purple}`, borderRadius: 22, padding: '34px 34px 38px', maxWidth: 560 }}>
              <div style={{ ...kickerStyle, color: T.purple }}>{fi.kicker || 'ÖN SATIŞA ÖZEL'}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 12 }}>
                <span style={{ fontFamily: T.serif, fontSize: 44 }}>{fi.price}</span>
                {fi.oldPrice && <s style={{ color: T.muted, fontSize: 20 }}>{fi.oldPrice}</s>}
              </div>
              {(fi.rows || []).length > 0 && (
                <ul style={{ ...pStyle, fontSize: 14.5, paddingLeft: 20 }}>
                  {(fi.rows || []).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
              {fi.alt && <div style={{ color: T.muted, fontSize: 13.5, marginTop: 14 }}>{fi.alt}</div>}
              <a href="/iletisim" style={{ display: 'inline-block', marginTop: 20, background: T.purple, color: '#F5F1E6', borderRadius: 999, padding: '13px 26px', textDecoration: 'none', fontWeight: 600 }}>Ön sipariş ver</a>
            </div>
          </section>
        )}

        {/* YORUMLAR (Hermes) */}
        {(yo.items || []).length > 0 && (
          <section style={sectionStyle}>
            <h2 style={h2Style}>{yo.title || 'Kullananlar ne diyor'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginTop: 26 }}>
              {(yo.items || []).map((r, i) => (
                <figure key={i} style={{ margin: 0, background: '#FFFFFF', border: `1px solid ${T.border}`, borderRadius: 18, padding: 24 }}>
                  <blockquote style={{ margin: 0, fontFamily: T.serif, fontStyle: 'italic', fontSize: 16.5, lineHeight: 1.6 }}>{r.quote || r.text}</blockquote>
                  <figcaption style={{ marginTop: 12, fontSize: 14, color: T.muted }}>{r.name}{r.role ? ` · ${r.role}` : ''}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* SSS */}
        {(ss.items || []).length > 0 && (
          <section style={sectionStyle}>
            <h2 style={h2Style}>{ss.title || 'Sık sorulanlar'}</h2>
            <div style={{ marginTop: 22, maxWidth: 780 }}>
              {(ss.items || []).map((q, i) => (
                <details key={i} style={{ borderBottom: `1px solid ${T.border}`, padding: '16px 4px' }}>
                  <summary style={{ fontFamily: T.serif, fontSize: 18, cursor: 'pointer' }}>{q.q}</summary>
                  <p style={{ ...pStyle, fontSize: 15 }}>{q.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={sectionStyle}>
          <div style={{ background: T.dark, color: '#EDE7DA', borderRadius: 28, padding: '54px 48px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ ...h2Style, color: '#F5F1E6', margin: 0 }}>{ct.title}</h2>
              <p style={{ ...pStyle, color: '#D8D2C2' }}>{ct.p || ct.paragraph}</p>
            </div>
            <a href="/iletisim" style={{ background: '#F5F1E6', color: T.ink, borderRadius: 999, padding: '15px 30px', textDecoration: 'none', fontWeight: 700 }}>{paid ? 'Ön sipariş ver' : 'Ücretsiz indir'}</a>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return { generateMetadata, Page };
}
