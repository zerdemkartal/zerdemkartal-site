// ANA SAYFA — HERMES tanıtım (H1 dönüşümü; eski çok amaçlı zerdemkartal ana sayfası kaldırıldı).
// İçerik: PageContent 'hermes_site' → home bölümü (MCP ile yönetilir). SEO+GEO: tam meta,
// Organization + WebSite + WebPage + SoftwareApplication (#hermes tekil düğüm) — uydurma puan yok.
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, appNode, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, h2Style, pStyle, sectionStyle, cardStyle, btnPrimary, btnGhost } from '@/components/Chrome';
import HeroLottie from '@/components/HeroLottie';

export const revalidate = 300;

export async function generateMetadata() {
  const c = await getHermes();
  return pageMeta({ ...c.seo.home, path: '/' });
}

function buildJsonLd(c) {
  const seo = c.seo.home;
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': SITE + '/#webpage', url: SITE + '/', name: seo.title, description: seo.description, inLanguage: 'tr-TR', isPartOf: { '@id': SITE + '/#site' }, about: { '@id': SITE + '/#hermes' } },
    appNode({ description: seo.description, featureList: (c.home.moduller.cards || []).map((x) => x.title) })
  ] };
}

export default async function Home() {
  const c = await getHermes();
  const { hero, moduller, akis, ai, gizlilik, fiyatBand } = c.home;

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active="/" />

      {/* HERO — ortalanmış + arkada büyük, soluk, animasyonlu Hermes logosu (filigran) */}
      <section className="hero" style={{ ...sectionStyle, paddingTop: 84, textAlign: 'center' }}>
        <HeroLottie />
        <div className="hero-inner">
          <div style={kickerStyle}>{hero.kicker}</div>
          <h1 style={{ ...h1Style, fontSize: 'clamp(44px, 6.4vw, 76px)' }}>{hero.title}</h1>
          <p style={{ ...pStyle, fontSize: 18, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>{hero.p}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28, alignItems: 'center', justifyContent: 'center' }}>
            <a href={hero.btn1Href} style={btnPrimary}>{hero.btn1}</a>
            <a href={hero.btn2Href} style={btnGhost}>{hero.btn2}</a>
          </div>
          {(hero.stats || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22, justifyContent: 'center' }}>
              {hero.stats.map((s, i) => (
                <span key={i} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 999, padding: '7px 16px', fontSize: 13.5, color: T.ink2 }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODÜLLER */}
      <section style={sectionStyle}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <div style={kickerStyle}>{moduller.kicker}</div>
          <h2 style={h2Style}>{moduller.title}</h2>
          <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }}>{moduller.p}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, marginTop: 30 }}>
          {(moduller.cards || []).map((f, i) => (
            <div key={i} className="zk-hover-card" style={cardStyle}>
              <div aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 12, background: T.accentBg, display: 'grid', placeItems: 'center', fontSize: 20 }}>{f.glyph}</div>
              <div style={{ fontFamily: T.serif, fontSize: 20, marginTop: 14 }}>{f.title}</div>
              <p style={{ ...pStyle, fontSize: 14.5, marginTop: 8 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 22 }}><a href="/ozellikler">Tüm özellikleri modül modül incele →</a></p>
      </section>

      {/* AI ANALİZ */}
      <section style={sectionStyle}>
        <div style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 28, padding: '44px 40px' }}>
          <div style={{ ...kickerStyle, color: T.accentText }}>{ai.kicker}</div>
          <h2 style={h2Style}>{ai.title}</h2>
          <p style={pStyle}>{ai.p}</p>
          <ul style={{ ...pStyle, fontSize: 15, paddingLeft: 20 }}>
            {(ai.rows || []).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      </section>

      {/* 3 ADIM */}
      <section style={sectionStyle}>
        <h2 style={{ ...h2Style, textAlign: 'center' }}>{akis.title}</h2>
        <ol style={{ ...pStyle, maxWidth: 720, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(akis.items || []).map((s, i) => <li key={i}><strong>{s.title}</strong> — {s.desc}</li>)}
        </ol>
      </section>

      {/* GİZLİLİK */}
      <section style={sectionStyle}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <div style={kickerStyle}>{gizlilik.kicker}</div>
          <h2 style={h2Style}>{gizlilik.title}</h2>
          <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }}>{gizlilik.p}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18, justifyContent: 'center' }}>
          {(gizlilik.rows || []).map((r, i) => (
            <span key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 999, padding: '9px 18px', fontSize: 14, color: T.ink2 }}>{r}</span>
          ))}
        </div>
      </section>

      {/* FİYAT BANDI */}
      <section style={sectionStyle}>
        <div style={{ background: T.dark, color: 'var(--h-dark-text)', borderRadius: 28, padding: '54px 48px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ ...kickerStyle, color: 'var(--h-dark-muted)' }}>{fiyatBand.kicker}</div>
            <h2 style={{ ...h2Style, color: 'var(--h-dark-wordmark)' }}>{fiyatBand.title}</h2>
            <p style={{ ...pStyle, color: 'var(--h-dark-text2)' }}>{fiyatBand.p}</p>
          </div>
          <a href="/fiyat" style={{ background: 'var(--h-dark-wordmark)', color: T.dark, borderRadius: 999, padding: '15px 30px', textDecoration: 'none', fontWeight: 700 }}>{fiyatBand.btn}</a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
