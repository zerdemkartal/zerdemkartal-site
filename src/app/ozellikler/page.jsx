// ÖZELLİKLER — doğrulanmış Hermes ürün envanteri. İçerik: 'hermes_site' → ozellikler.
// Her grup #<id> çapasıyla derin linklenebilir (GEO: bölüm bazlı adreslenebilirlik).
// JSON-LD: WebPage + Breadcrumb + SoftwareApplication (tam featureList) + ItemList.
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, appNode, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, h2Style, pStyle, sectionStyle, cardStyle, btnPrimary, btnGhost } from '@/components/Chrome';
import Shot from '@/components/Shot';
// Faz 1 (27 Tem 2026) — kaydırmada beliriş + yapışkan anlatım akışı (.h-sticky, layout.jsx CSS).
import Reveal from '@/components/Reveal';
// Faz 2 (27 Tem 2026) — kart parıltısı/eğilmesi.
import Spotlight from '@/components/Spotlight';
// Faz 4 (27 Tem 2026) — sayaçlar. Rakamlar doğrulanmış envanterden SAYILIR (uydurma yok).
import Counter from '@/components/Counter';

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
    { '@type': 'ItemList', name: 'Hermes çalışma alanları', itemListElement: (c.ozellikler.gruplar || []).map((g, i) => ({
      '@type': 'ListItem', position: i + 1, name: g.baslik, url: SITE + PATH + '#' + g.id
    })) }
  ] };
}

export default async function Ozellikler() {
  const c = await getHermes();
  const oz = c.ozellikler;
  // Sayaç değerleri = doğrulanmış envanterin GERÇEK sayımı. Her sayılan araç
  // aşağıdaki kartlardan biri olarak görünür; elle yazılmış pazarlama sayısı yok.
  const grupSayisi = (oz.gruplar || []).length;
  const ozellikSayisi = (oz.gruplar || []).reduce((t, g) => t + (g.items || []).length, 0);

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active={PATH} />

      <section className="h-feature-hero">
        <div className="h-feature-copy">
          <div style={kickerStyle} data-he data-path="ozellikler.hero.kicker">{oz.hero.kicker}</div>
          <h1 style={h1Style} data-he data-path="ozellikler.hero.title">{oz.hero.title}</h1>
          <p style={pStyle} data-he data-path="ozellikler.hero.p">{oz.hero.p}</p>
          {/* Faz 4 — sayaçlar (görünüre girince sayar; JS yoksa son değer basılı) */}
          <div className="h-feature-metrics">
            {[[grupSayisi, 'ana çalışma alanı'], [ozellikSayisi, 'çalışan araç & özellik']].map(([sayi, ad]) => (
              <div key={ad}>
                <div style={{ fontFamily: T.serif, fontSize: 40, lineHeight: 1, color: T.accentText }}>
                  <Counter to={sayi} />
                </div>
                <div style={{ ...kickerStyle, marginTop: 8 }}>{ad.toLocaleUpperCase('tr')}</div>
              </div>
            ))}
          </div>
          <div className="h-route-actions">
            <a href="/satin-al" style={btnPrimary}>Satın al</a>
            <a href="#harita-zodyak" style={btnGhost}>Envanteri incele</a>
          </div>
        </div>
        <Shot
          src={oz.gruplar?.[0]?.gorsel?.src}
          cap={oz.gruplar?.[0]?.gorsel?.cap}
          alt="Hermes yeni nesil 90 derece harita motoru ekranı"
          priority
          style={{ width: '100%' }}
        />
        <div className="h-feature-pills">
          {(oz.gruplar || []).map((g) => (
            <a key={g.id} href={'#' + g.id} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 999, padding: '8px 16px', fontSize: 13.5, color: T.ink2, textDecoration: 'none' }}>{g.baslik}</a>
          ))}
        </div>
      </section>

      {(oz.gruplar || []).map((g, gi) => (
        // YAPIŞKAN AKIŞ (Faz 1): ≥1024px'te sol sütun (başlık + giriş + ekran görüntüsü)
        // yapışkan kalır, sağdaki kart ızgarası akar. Altında tek sütuna döner.
        // Çapa id'si ve data-path'ler DEĞİŞMEDİ (ItemList JSON-LD + EditLayer bozulmasın).
        <section key={g.id} id={g.id} style={sectionStyle}>
          <div className="h-sticky">
            <div className="h-sticky-aside">
              <Reveal>
                <h2 style={{ ...h2Style, marginTop: 0 }} data-he data-path={`ozellikler.gruplar.${gi}.baslik`}>{g.baslik}</h2>
                <p style={pStyle} data-he data-path={`ozellikler.gruplar.${gi}.giris`}>{g.giris}</p>
                {g.gorsel && g.gorsel.src ? (
                  <Shot src={g.gorsel.src} cap={g.gorsel.cap} alt={`${g.baslik} — Hermes ekran görüntüsü`} style={{ marginTop: 24 }} />
                ) : null}
              </Reveal>
            </div>
            <div className="h-feature-card-grid">
              {(g.items || []).map((x, i) => (
                <Reveal key={i} className="h-r-fill" delay={i * 70}>
                  <Spotlight style={cardStyle} tilt={3.5}>
                    <div style={{ fontFamily: T.serif, fontSize: 19 }} data-he data-path={`ozellikler.gruplar.${gi}.items.${i}.ad`}>{x.ad}</div>
                    <p style={{ ...pStyle, fontSize: 14.5, marginTop: 8 }} data-he data-path={`ozellikler.gruplar.${gi}.items.${i}.desc`}>{x.desc}</p>
                  </Spotlight>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section style={sectionStyle}>
        <Reveal style={{ background: T.dark, color: 'var(--h-dark-text)', borderRadius: 28, padding: '48px 44px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ ...h2Style, color: 'var(--h-dark-wordmark)', margin: 0 }}>Tek programda, tek çalışma düzeninde.</h2>
            <p style={{ ...pStyle, color: 'var(--h-dark-text2)' }}>Parça parça modül satışı yok; bu envanterdeki çalışma alanları ve araçlar cihaz lisansına dahildir.</p>
          </div>
          <a href="/fiyat" style={{ background: 'var(--h-dark-wordmark)', color: T.dark, borderRadius: 999, padding: '15px 30px', textDecoration: 'none', fontWeight: 700 }}>Fiyatı gör</a>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
