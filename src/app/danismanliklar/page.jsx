// DANIŞMANLIKLAR — katalog SSR portu (piksel referansı: DanismanlikView.dc.html; içerik = PageContent 'danismanlik').
// Analiz detayları ayrı rota: /danismanliklar/analiz/[slug]. Her kart oraya derin link + #analiz-<slug> çapası.
import { getContent } from '@/lib/content';
import { DANISMANLIK } from '@/lib/defaults';
import { SITE, ORG, WEBSITE, priceNum, analizSlugs, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, h2Style, pStyle, sectionStyle } from '@/components/Chrome';

export const revalidate = 300;

const URL_ = SITE + '/danismanliklar';
const load = () => getContent('danismanlik', DANISMANLIK);

export async function generateMetadata() {
  const c = await load();
  const seo = c.seo || {};
  return pageMeta({ title: seo.title || DANISMANLIK.seo.title, description: seo.description || DANISMANLIK.seo.description, path: '/danismanliklar' });
}

function buildJsonLd(c) {
  const slugs = analizSlugs(c);
  const offers = slugs.map((x) => {
    const num = priceNum(x.a.p);
    const o = { '@type': 'Offer', name: x.a.n, description: x.a.d, url: `${URL_}/analiz/${x.slug}` };
    if (num) { o.price = num; o.priceCurrency = 'TRY'; }
    return o;
  });
  const reviews = ((c.referanslar || {}).items || []).map((r) => ({
    '@type': 'Review', reviewBody: r.quote, author: { '@type': 'Person', name: r.name },
    reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' }
  }));
  const steps = ((c.surec || {}).steps || []).map((s) => ({ '@type': 'HowToStep', name: s.title, text: s.desc }));
  const faqs = ((c.sss || {}).items || []).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }));
  const ast = c.astrolog || {};
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Danışmanlıklar', item: URL_ }
    ] },
    { '@type': 'WebPage', '@id': URL_ + '#webpage', url: URL_, name: (c.seo && c.seo.title) || DANISMANLIK.seo.title, description: (c.seo && c.seo.description) || DANISMANLIK.seo.description, isPartOf: { '@id': SITE + '/#site' } },
    { '@type': 'Service', '@id': URL_ + '#service', name: 'Birebir Astroloji Danışmanlığı', serviceType: 'Astroloji danışmanlığı', areaServed: 'TR', provider: { '@id': SITE + '/#org' },
      description: (c.hero || {}).paragraph || '',
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '500', bestRating: '5' },
      review: reviews,
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Analizler', itemListElement: offers }
    },
    { '@type': 'Person', '@id': SITE + '/#astrolog', name: 'zerdemkartal', description: ast.paragraph || '', knowsAbout: ['Astroloji', 'Doğum haritası', 'Sinastri', 'Transit analizi'], sameAs: ['https://instagram.com/zerdemkartal', 'https://youtube.com/@zerdemkartal'] },
    { '@type': 'HowTo', name: (c.surec || {}).title || 'Seans nasıl işler', step: steps },
    { '@type': 'FAQPage', mainEntity: faqs }
  ] };
}

const btnDark = { background: T.dark, color: '#F5F1E6', borderRadius: 999, padding: '14px 28px', textDecoration: 'none', fontWeight: 600, fontSize: 15.5 };
const btnGhost = { border: `1px solid ${T.border}`, color: T.ink, borderRadius: 999, padding: '14px 28px', textDecoration: 'none', fontSize: 15.5 };
const WHATSAPP = 'https://wa.me/905454564275?text=' + encodeURIComponent('Merhaba, astroloji danışmanlığı için randevu almak istiyorum.');
const btnWhats = { background: '#25D366', color: '#FFFFFF', borderRadius: 999, padding: '14px 24px', textDecoration: 'none', fontWeight: 600, fontSize: 15.5 };

export default async function Danismanliklar() {
  const c = await load();
  const hero = c.hero || {};
  const analiz = c.analiz || {};
  const surec = c.surec || {};
  const ast = c.astrolog || {};
  const ref = c.referanslar || {};
  const sss = c.sss || {};
  const cta = c.cta || {};
  const slugs = analizSlugs(c);
  const slugOf = (gi, ci) => (slugs.find((s) => s.gi === gi && s.ci === ci) || {}).slug || '';

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active="/danismanliklar" />

      {/* HERO */}
      <section style={{ ...sectionStyle, paddingTop: 60, textAlign: 'center' }}>
        <div style={kickerStyle}>{hero.kicker}</div>
        <h1 style={h1Style}>{hero.titleA}<span style={{ color: T.purple, fontStyle: 'italic' }}>{hero.titleEm}</span>{hero.titleB}</h1>
        <p style={{ ...pStyle, margin: '16px auto 0' }}>{hero.paragraph}</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', margin: '16px 0 0', color: T.muted, fontSize: 14.5 }}>
          {(hero.stats || []).map((s, i) => <span key={i}>{s}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/iletisim" style={btnDark}>{hero.primaryBtn || 'Randevu al'}</a>
          <a href={WHATSAPP} target="_blank" rel="noopener" style={btnWhats}>WhatsApp'tan yaz</a>
          <a href="#analiz" style={btnGhost}>{hero.secondaryBtn || 'Analizleri gör'}</a>
        </div>
      </section>

      {/* GÜVEN ŞERİDİ */}
      <section style={{ ...sectionStyle, paddingTop: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {(c.trust || []).map((t, i) => (
            <div key={i} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 16, padding: '26px 22px', textAlign: 'center' }}>
              <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 600 }}>{t.big}</div>
              <div style={{ fontSize: 14, color: T.muted, marginTop: 6 }}>{t.small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ANALİZLER */}
      <section id="analiz" style={sectionStyle}>
        <div style={kickerStyle}>{analiz.kicker}</div>
        <h2 style={h2Style}>{analiz.title}</h2>
        <p style={pStyle}>{analiz.paragraph}</p>
        {(analiz.groups || []).map((g, gi) => (
          <div key={gi} style={{ marginTop: 34 }}>
            <h3 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 520, margin: '0 0 14px' }}>{g.cat}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {(g.items || []).map((a, ci) => {
                const slug = slugOf(gi, ci);
                return (
                  <a key={ci} id={`analiz-${slug}`} href={`/danismanliklar/analiz/${slug}`} className="zk-hover-card"
                    style={{ display: 'block', background: '#FFFFFF', border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 20px', textDecoration: 'none', color: T.ink, scrollMarginTop: 90 }}>
                    <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500 }}>{a.n}</div>
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: T.ink2, margin: '8px 0 14px' }}>{a.d}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600 }}>{a.p}</span>
                      <span style={{ fontSize: 13, color: T.muted }}>{a.t}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* SÜREÇ */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>{surec.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginTop: 24 }}>
          {(surec.steps || []).map((s, i) => (
            <div key={i} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ fontFamily: T.serif, fontSize: 22, color: T.purple }}>{s.no}</div>
              <div style={{ fontWeight: 600, margin: '8px 0 6px' }}>{s.title}</div>
              <p style={{ fontSize: 14, color: T.ink2, margin: 0, lineHeight: 1.55 }}>{s.desc}</p>
            </div>
          ))}
        </div>
        <p style={{ ...pStyle, fontSize: 14.5 }}><strong>{surec.gizlilikStrong}</strong>{surec.gizlilikText}</p>
      </section>

      {/* ASTROLOG */}
      <section style={sectionStyle}>
        <div style={kickerStyle}>{ast.kicker}</div>
        <h2 style={h2Style}>{ast.title}</h2>
        <p style={pStyle}>{ast.paragraph}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          {(ast.tags || []).map((t, i) => (
            <span key={i} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 999, padding: '8px 16px', fontSize: 13.5, color: T.ink2 }}>{t}</span>
          ))}
        </div>
      </section>

      {/* REFERANSLAR */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>{ref.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 24 }}>
          {(ref.items || []).map((r, i) => (
            <figure key={i} style={{ background: '#FFFFFF', border: `1px solid ${T.border}`, borderRadius: 16, padding: '22px 22px', margin: 0 }}>
              <blockquote style={{ margin: 0, fontFamily: T.serif, fontSize: 17, lineHeight: 1.5, color: T.ink }}>{r.quote}</blockquote>
              <figcaption style={{ marginTop: 14, fontSize: 13.5, color: T.muted }}><strong style={{ color: T.ink2 }}>{r.name}</strong> · {r.role}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* SSS */}
      <section style={{ ...sectionStyle, maxWidth: 820 }}>
        <h2 style={h2Style}>{sss.title}</h2>
        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          {(sss.items || []).map((f, i) => (
            <div key={i} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{f.q}</div>
              <p style={{ fontSize: 14.5, color: T.ink2, margin: '8px 0 0', lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...sectionStyle, paddingBottom: 8 }}>
        <div style={{ background: T.dark, color: '#F5F1E6', borderRadius: 28, padding: '48px 40px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 'clamp(26px, 3.4vw, 38px)', margin: 0 }}>{cta.title}</h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.7, color: '#D8D2C2', margin: '12px auto 0', maxWidth: 560 }}>{cta.paragraph}</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
            <a href="/iletisim" style={{ background: '#F5F1E6', color: T.ink, borderRadius: 999, padding: '14px 30px', textDecoration: 'none', fontWeight: 600 }}>{cta.primaryBtn || 'Randevu al'}</a>
            <a href={WHATSAPP} target="_blank" rel="noopener" style={{ background: '#25D366', color: '#FFFFFF', borderRadius: 999, padding: '14px 30px', textDecoration: 'none', fontWeight: 600 }}>WhatsApp'tan yaz</a>
          </div>
          <div style={{ fontSize: 13, color: '#A7A296', marginTop: 20 }}>{cta.foot}</div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
