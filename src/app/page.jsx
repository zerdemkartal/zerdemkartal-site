// ANA SAYFA — HERMES tanıtım (H1 dönüşümü; eski çok amaçlı zerdemkartal ana sayfası kaldırıldı).
// İçerik: PageContent 'hermes_site' → home bölümü (MCP ile yönetilir). SEO+GEO: tam meta,
// Organization + WebSite + WebPage + SoftwareApplication (#hermes tekil düğüm) — uydurma puan yok.
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, appNode, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
// 27 Tem 2026 — hero, gerçek ürün ekranını ve satın alma yolunu ilk görünümde
// buluşturan ürün vitrini olarak yeniden kuruldu. Eski dev wordmark kilidi kaldırıldı.
import { Nav, Footer, T, kickerStyle, h2Style, pStyle, sectionStyle, cardStyle, btnPrimary, btnGhost } from '@/components/Chrome';
import Ekranlar from '@/components/Ekranlar';
// Faz 1 (27 Tem 2026) — kaydırmada beliriş. Salt görsel katman: metin SSR'da basılı kalır.
import Reveal from '@/components/Reveal';
// Faz 2 (27 Tem 2026) — imleç parıltısı + kenar ışığı + hafif eğilme. .zk-hover-card'ın
// yerini alır (ikisi de transform yazıyor, birlikte kullanılmaz).
import Spotlight from '@/components/Spotlight';
// Faz 4 (27 Tem 2026) — akan şerit. İçerik uydurulmaz: şeritteki başlıklar
// hermes_site.home.moduller.cards'tan gelir, MCP'den değişince şerit de değişir.
import Marquee from '@/components/Marquee';

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
  const { hero, moduller, akis, ekranlar, gizlilik, fiyatBand } = c.home;

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active="/" />

      {/* HERO — ürün vaadi + satın alma yolu + gerçek Hermes ekranı aynı görünümde. */}
      <section className="h-home-hero">
        <div className="h-hero-copy">
          <div className="h-hero-brandline">
            <img src="/assets/hermes-mark.svg" alt="" aria-hidden="true" />
            <div style={kickerStyle} data-he data-path="home.hero.kicker">{hero.kicker}</div>
          </div>
          <h1 data-he data-path="home.hero.title">{hero.title}</h1>
          <p data-he data-path="home.hero.p">{hero.p}</p>
          <div className="h-hero-actions">
            <a href={hero.btn2Href || '/fiyat'} style={btnPrimary} data-he data-path="home.hero.btn2">{hero.btn2}</a>
            <a href={hero.btn1Href || '/ozellikler'} style={btnGhost} data-he data-path="home.hero.btn1">{hero.btn1}</a>
          </div>
          <div className="h-hero-trust" aria-label="Hermes kısa bilgiler">
            {(hero.stats || []).map((x, i) => (
              <span key={i} data-he data-path={`home.hero.stats.${i}`}>{x}</span>
            ))}
          </div>
        </div>

        <div className="h-hero-showcase" aria-label="Hermes programından gerçek ekran görüntüsü">
          <div className="h-hero-orbit" aria-hidden="true" />
          <figure className="h-hero-window">
            <span className="h-shot-dots" aria-hidden="true"><i /><i /><i /></span>
            <img
              src={ekranlar.shots?.[0]?.src}
              alt={ekranlar.shots?.[0]?.alt || 'Hermes program ekranı'}
              fetchPriority="high"
            />
          </figure>
          <div className="h-hero-proof h-hero-proof-top">
            <span>GERÇEK PROGRAM EKRANI</span>
            <strong>Yeni nesil 90° kadran</strong>
          </div>
          <div className="h-hero-proof h-hero-proof-bottom">
            <span>HESAP ÇEKİRDEĞİ</span>
            <strong>Swiss Ephemeris</strong>
          </div>
        </div>
      </section>

      {/* AKAN ŞERİT — modül başlıkları (Faz 4). Salt dekoratif değil: gerçek modül adları. */}
      <Marquee items={(moduller.cards || []).map((x) => x.title)} sure={46} style={{ marginTop: 16 }} />

      {/* EKRAN GÖRÜNTÜLERİ — geçişli galeri (hero'nun hemen altında) */}
      <Ekranlar data={ekranlar} />

      {/* MODÜLLER */}
      <section style={sectionStyle}>
        <Reveal style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <div style={kickerStyle} data-he data-path="home.moduller.kicker">{moduller.kicker}</div>
          <h2 style={h2Style} data-he data-path="home.moduller.title">{moduller.title}</h2>
          <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }} data-he data-path="home.moduller.p">{moduller.p}</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, marginTop: 30 }}>
          {(moduller.cards || []).map((f, i) => (
            <Reveal key={i} className="h-r-fill" delay={i * 70}>
              <Spotlight style={cardStyle}>
                <div aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 12, background: T.accentBg, display: 'grid', placeItems: 'center', fontSize: 20 }}>{f.glyph}</div>
                <div style={{ fontFamily: T.serif, fontSize: 20, marginTop: 14 }} data-he data-path={`home.moduller.cards.${i}.title`}>{f.title}</div>
                <p style={{ ...pStyle, fontSize: 14.5, marginTop: 8 }} data-he data-path={`home.moduller.cards.${i}.desc`}>{f.desc}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
        <p style={{ marginTop: 22 }}><a href="/ozellikler">Tüm özellikleri modül modül incele →</a></p>
      </section>

      {/* 3 ADIM */}
      <section style={sectionStyle}>
        <Reveal as="h2" style={{ ...h2Style, textAlign: 'center' }} data-he data-path="home.akis.title">{akis.title}</Reveal>
        <ol className="h-step-grid">
          {(akis.items || []).map((s, i) => (
            <Reveal as="li" key={i} className="h-step-card" delay={i * 90}>
              <span className="h-step-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <strong data-he data-path={`home.akis.items.${i}.title`}>{s.title}</strong>
              <span data-he data-path={`home.akis.items.${i}.desc`}>{s.desc}</span>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* GİZLİLİK */}
      <section style={sectionStyle}>
        <Reveal className="h-privacy-panel">
          <div className="h-privacy-copy">
            <div style={kickerStyle} data-he data-path="home.gizlilik.kicker">{gizlilik.kicker}</div>
            <h2 style={h2Style} data-he data-path="home.gizlilik.title">{gizlilik.title}</h2>
            <p style={pStyle} data-he data-path="home.gizlilik.p">{gizlilik.p}</p>
          </div>
          <div className="h-privacy-list">
            {(gizlilik.rows || []).map((r, i) => (
              <div key={i} className="h-privacy-row">
                <span className="h-privacy-dot" aria-hidden="true" />
                <span data-he data-path={`home.gizlilik.rows.${i}`}>{r}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* FİYAT BANDI */}
      <section style={sectionStyle}>
        <Reveal style={{ background: T.dark, color: 'var(--h-dark-text)', borderRadius: 28, padding: '54px 48px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ ...kickerStyle, color: 'var(--h-dark-muted)' }} data-he data-path="home.fiyatBand.kicker">{fiyatBand.kicker}</div>
            <h2 style={{ ...h2Style, color: 'var(--h-dark-wordmark)' }} data-he data-path="home.fiyatBand.title">{fiyatBand.title}</h2>
            <p style={{ ...pStyle, color: 'var(--h-dark-text2)' }} data-he data-path="home.fiyatBand.p">{fiyatBand.p}</p>
          </div>
          <a href="/fiyat" style={{ background: 'var(--h-dark-wordmark)', color: T.dark, borderRadius: 999, padding: '15px 30px', textDecoration: 'none', fontWeight: 700 }} data-he data-path="home.fiyatBand.btn">{fiyatBand.btn}</a>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
