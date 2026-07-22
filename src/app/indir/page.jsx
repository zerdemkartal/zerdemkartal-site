// İNDİR — kurulum + sistem gereksinimleri (H1). İçerik: 'hermes_site' → indir.
// H3'te GitHub hermes-yayin releases beslemesi eklenecek (son sürüm + notlar otomatik).
// JSON-LD: WebPage + Breadcrumb + SoftwareApplication + HowTo (kurulum adımları).
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, appNode, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, h2Style, pStyle, sectionStyle, cardStyle, btnPrimary } from '@/components/Chrome';
import { getLatestRelease } from '@/lib/releases';

export const revalidate = 300;
const PATH = '/indir';

export async function generateMetadata() {
  const c = await getHermes();
  return pageMeta({ ...c.seo.indir, path: PATH });
}

function buildJsonLd(c) {
  const seo = c.seo.indir;
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': SITE + PATH + '#webpage', url: SITE + PATH, name: seo.title, description: seo.description, inLanguage: 'tr-TR', isPartOf: { '@id': SITE + '/#site' }, about: { '@id': SITE + '/#hermes' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'İndir', item: SITE + PATH }
    ] },
    appNode({ description: seo.description }),
    { '@type': 'HowTo', name: c.indir.adimlar.title + ' — Hermes', step: (c.indir.adimlar.items || []).map((s, i) => ({
      '@type': 'HowToStep', position: i + 1, name: s.title, text: s.desc
    })) }
  ] };
}

export default async function Indir() {
  const c = await getHermes();
  const { hero, surum, adimlar, sistem } = c.indir;
  const rel = await getLatestRelease(); // GitHub'da yayın yoksa null → statik surum bilgisi

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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24, alignItems: 'center', justifyContent: 'center' }}>
          <a href="/fiyat" style={btnPrimary}>Ön sipariş ver</a>
          <span style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 999, padding: '9px 18px', fontSize: 13.5, color: T.ink2 }}>{surum.baslik}: {rel?.version || surum.ver}</span>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ ...h2Style, textAlign: 'center' }}>{adimlar.title}</h2>
        <ol style={{ ...pStyle, maxWidth: 720, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(adimlar.items || []).map((s, i) => <li key={i}><strong>{s.title}</strong> — {s.desc}</li>)}
        </ol>
        <p style={{ ...pStyle, fontSize: 14.5, color: T.muted }}>{surum.not}</p>
        {rel && (
          <p style={{ ...pStyle, fontSize: 14, color: T.muted, marginTop: 8 }}>
            Son yayın: sürüm {rel.version}{rel.publishedAt ? ` · ${new Date(rel.publishedAt).toLocaleDateString('tr-TR')}` : ''}
            {rel.htmlUrl ? <> · <a href={rel.htmlUrl} target="_blank" rel="noopener">Sürüm notları →</a></> : null}
          </p>
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={{ ...h2Style, textAlign: 'center' }}>{sistem.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 24, maxWidth: 780 }}>
          <div style={{ ...cardStyle, background: T.cream }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Windows</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.8, color: T.ink2 }}>
              {(sistem.win || []).map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Yol haritası</div>
            <p style={{ ...pStyle, fontSize: 14.5, margin: 0 }}>{sistem.not}</p>
            <p style={{ marginTop: 14, fontSize: 14.5 }}><a href="/sss">Web sürümü hakkında SSS →</a></p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
