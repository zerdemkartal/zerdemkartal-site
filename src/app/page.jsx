// ANA SAYFA — SSR portu (piksel referansı: AnaSayfaView.dc.html; içerik = PageContent 'anasayfa').
// Carousel + akan yazı + marquee'ler istemci bileşenleridir (HomeHero, Marquee); içerik SSR/crawlable basılır.
import { getContent } from '@/lib/content';
import { ANASAYFA } from '@/lib/defaults';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h2Style, pStyle, sectionStyle } from '@/components/Chrome';
import HomeHero from './HomeHero';
import Marquee from './Marquee';

export const revalidate = 300;

const load = () => getContent('anasayfa', ANASAYFA);

export async function generateMetadata() {
  const c = await load();
  const seo = c.seo || {};
  return pageMeta({ title: seo.title || ANASAYFA.seo.title, description: seo.description || ANASAYFA.seo.description, path: '/' });
}

function buildJsonLd(c) {
  const d = c.danismanlik || {};
  const e = c.egitimler || {};
  const courses = (e.cards || []).map((k) => ({
    '@type': 'Course', name: k.title, description: k.desc,
    provider: { '@id': SITE + '/#org' }, inLanguage: 'tr'
  }));
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': SITE + '/#webpage', url: SITE + '/', name: (c.seo && c.seo.title) || ANASAYFA.seo.title, description: (c.seo && c.seo.description) || ANASAYFA.seo.description, isPartOf: { '@id': SITE + '/#site' } },
    { '@type': 'SoftwareApplication', name: 'AstroPen', applicationCategory: 'LifestyleApplication', operatingSystem: 'Windows, macOS', offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }, publisher: { '@id': SITE + '/#org' } },
    { '@type': 'Service', name: 'Birebir Astroloji Danışmanlığı', serviceType: 'Astroloji danışmanlığı', areaServed: 'TR', provider: { '@id': SITE + '/#org' }, description: d.paragraph || '', url: SITE + '/danismanliklar' },
    ...courses,
    { '@type': 'WebApplication', name: 'Doğum Haritası Aracı', applicationCategory: 'Astrology', browserRequirements: 'Requires JavaScript', offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }, url: SITE + '/dogum-haritasi' }
  ] };
}

const btnDark = { background: T.dark, color: '#F5F1E6', borderRadius: 14, padding: '15px 26px', textDecoration: 'none', fontWeight: 600, fontSize: 16, display: 'inline-block' };
const btnGhost = { border: `1px solid ${T.border}`, color: T.ink, borderRadius: 999, padding: '13px 26px', textDecoration: 'none', fontSize: 15.5, display: 'inline-block' };
const card = { display: 'block', background: '#FFFFFF', border: `1px solid ${T.border}`, borderRadius: 18, padding: '22px 22px', textDecoration: 'none', color: T.ink };
const priceChip = { fontFamily: T.serif, fontSize: 20, fontWeight: 600 };

export default async function AnaSayfa() {
  const c = await load();
  const hero = c.hero || {};
  const flow = c.flow || {};
  const u = c.uygulama || {};
  const d = c.danismanlik || {};
  const e = c.egitimler || {};
  const blog = c.blog || {};
  const harita = c.haritaCta || {};

  return (
    <main style={{ overflow: 'hidden' }}>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active="/" />

      {/* HERO — carousel + akan yazı (istemci) */}
      <HomeHero slides={hero.slides || []} flow={flow} />

      {/* KOYU ŞERİT */}
      <Marquee text={flow.ribbon} rotate={-2.4} base={34} variant="ribbon" />

      {/* UYGULAMA (AstroPen) — 2 kolon */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '90px 32px 70px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 70, alignItems: 'center' }}>
        <div>
          <div style={kickerStyle}>{u.kicker}</div>
          <h2 style={{ fontFamily: T.serif, fontWeight: 430, fontSize: 'clamp(40px, 4.6vw, 60px)', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '18px 0 0' }}>{u.title}</h2>
          <p style={{ ...pStyle, fontSize: 18 }}>{u.paragraph}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 30 }}>
            {(u.features || []).map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 13 }}>
                <span aria-hidden="true" style={{ color: T.purple, flex: 'none' }}>✳</span>
                <span style={{ fontSize: 16.5, color: T.ink }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 38, flexWrap: 'wrap' }}>
            <a href={u.href || '/programlar'} style={btnDark}>{u.btn || 'Programı keşfet →'}</a>
            <span style={{ fontSize: 14, color: T.muted }}>{u.note}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#DCE7DB', borderRadius: 32, padding: 26, transform: 'rotate(2.2deg)', boxShadow: '0 30px 60px rgba(142,124,195,0.20)' }}>
            <div style={{ width: 'min(410px, 68vw)', height: 260, background: '#FBFAF7', borderRadius: 14, transform: 'rotate(-2.2deg)', boxShadow: '0 18px 44px rgba(43,29,18,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontFamily: T.serif, fontSize: 22 }}>AstroPen</div>
          </div>
        </div>
      </section>

      {/* AÇIK ŞERİT */}
      <Marquee text={flow.tags} rotate={1.6} base={30} variant="tags" />

      {/* DANIŞMANLIK */}
      <section style={{ ...sectionStyle, paddingTop: 90 }}>
        <div style={kickerStyle}>{d.kicker}</div>
        <h2 style={h2Style}>{d.title}</h2>
        <p style={pStyle}>{d.paragraph}</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '14px 0 0', color: T.muted, fontSize: 14.5 }}>
          {(d.stats || []).map((s, i) => <span key={i}>{s}</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 24 }}>
          {(d.cards || []).map((k, i) => (
            <a key={i} href="/danismanliklar" className="zk-hover-card" style={card}>
              <div style={{ fontFamily: T.serif, fontSize: 20 }}>{k.title}</div>
              <p style={{ fontSize: 14, color: T.muted, margin: '8px 0 14px' }}>{k.sub}</p>
              <span style={priceChip}>{k.price}</span>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 26 }}><a href={d.href || '/danismanliklar'} style={btnGhost}>{d.btn || 'Danışmanlıkları gör →'}</a></div>
      </section>

      {/* EĞİTİMLER */}
      <section style={sectionStyle}>
        <div style={kickerStyle}>{e.kicker}</div>
        <h2 style={h2Style}>{e.title}</h2>
        <p style={pStyle}>{e.paragraph}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 24 }}>
          {(e.cards || []).map((k, i) => (
            <div key={i} className="zk-hover-card" style={{ ...card, cursor: 'default' }}>
              <div style={{ ...kickerStyle, fontSize: 11 }}>{k.badge}</div>
              <div style={{ fontFamily: T.serif, fontSize: 20, margin: '8px 0 0' }}>{k.title}</div>
              <p style={{ fontSize: 14, color: T.ink2, margin: '8px 0 14px' }}>{k.desc}</p>
              <span style={priceChip}>{k.price}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 26 }}><a href={e.href || '/astroloji-101'} style={btnGhost}>Astroloji 101 →</a></div>
      </section>

      {/* BLOG */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <h2 style={{ ...h2Style, margin: 0 }}>{blog.title || 'Günlük'}</h2>
          <a href={blog.href || '/blog'} style={{ color: T.purple, textDecoration: 'none', fontWeight: 600 }}>{blog.link || 'Tümünü oku →'}</a>
        </div>
      </section>

      {/* HARİTA CTA */}
      <section style={{ ...sectionStyle, paddingBottom: 8 }}>
        <div style={{ background: T.dark, color: '#F5F1E6', borderRadius: 28, padding: '48px 40px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 'clamp(26px, 3.2vw, 36px)', margin: 0 }}>{harita.title}</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: '#D8D2C2', margin: '12px 0 0' }}>{harita.paragraph}</p>
          </div>
          <a href={harita.href || '/dogum-haritasi'} style={{ background: '#F5F1E6', color: T.ink, borderRadius: 999, padding: '15px 30px', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>{harita.btn || 'Doğum haritası aracı →'}</a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
