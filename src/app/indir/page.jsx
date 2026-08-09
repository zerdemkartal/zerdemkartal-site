// İNDİR — kurulum + sistem gereksinimleri (H1). İçerik: 'hermes_site' → indir.
// Yayın kaynağı sunucu tarafında çözülür; ziyaretçiye yalnız markalı indirme yolu gösterilir.
// JSON-LD: WebPage + Breadcrumb + SoftwareApplication + HowTo (kurulum adımları).
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, appNode, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, h2Style, pStyle, sectionStyle, cardStyle } from '@/components/Chrome';
import { getLatestRelease } from '@/lib/releases';
import Shot from '@/components/Shot';
import DownloadAccess from '@/components/DownloadAccess';

// Yayın kaydı Neon'dan okunur; derleme anında yeni migration henüz uygulanmamış olabilir.
export const dynamic = 'force-dynamic';
const PATH = '/indir';

export async function generateMetadata() {
  const c = await getHermes();
  return {
    ...pageMeta({ ...c.seo.indir, path: PATH }),
    robots: { index: false, follow: false },
    referrer: 'no-referrer'
  };
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

export default async function Indir(props) {
  const searchParams = await props.searchParams;
  const c = await getHermes();
  const { hero, gorsel, surum, adimlar, sistem } = c.indir;
  const rel = await getLatestRelease();

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active={PATH} />

      <section style={{ ...sectionStyle, paddingTop: 64 }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
          <div style={kickerStyle} data-he data-path="indir.hero.kicker">{hero.kicker}</div>
          <h1 style={h1Style} data-he data-path="indir.hero.title">{hero.title}</h1>
          <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }} data-he data-path="indir.hero.p">{hero.p}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24, alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 999, padding: '9px 18px', fontSize: 13.5, color: T.ink2 }}>{surum.baslik}: {rel?.version || surum.ver}</span>
        </div>
        <DownloadAccess
          version={rel?.version || surum.ver}
          inviteToken={typeof searchParams?.d === 'string' ? searchParams.d : ''}
          accessRequired={searchParams?.erisim === 'gerekli'}
        />
        {gorsel && gorsel.src ? (
          <Shot src={gorsel.src} cap={gorsel.cap} alt="Hermes açılış ekranı — ekran görüntüsü" priority style={{ maxWidth: 960, margin: '34px auto 0' }} />
        ) : null}
      </section>

      <section style={sectionStyle}>
        <h2 style={{ ...h2Style, textAlign: 'center' }} data-he data-path="indir.adimlar.title">{adimlar.title}</h2>
        <ol style={{ ...pStyle, maxWidth: 720, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(adimlar.items || []).map((s, i) => <li key={i}><strong data-he data-path={`indir.adimlar.items.${i}.title`}>{s.title}</strong> — <span data-he data-path={`indir.adimlar.items.${i}.desc`}>{s.desc}</span></li>)}
        </ol>
        <p style={{ ...pStyle, fontSize: 14.5, color: T.muted }} data-he data-path="indir.surum.not">{surum.not}</p>
        {rel && (
          <p style={{ ...pStyle, fontSize: 14, color: T.muted, marginTop: 8 }}>
            Son yayın: sürüm {rel.version}{rel.publishedAt ? ` · ${new Date(rel.publishedAt).toLocaleDateString('tr-TR')}` : ''}
          </p>
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={{ ...h2Style, textAlign: 'center' }} data-he data-path="indir.sistem.title">{sistem.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 24, maxWidth: 780 }}>
          <div style={{ ...cardStyle, background: T.cream }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Windows</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.8, color: T.ink2 }}>
              {(sistem.win || []).map((r, i) => <li key={i} data-he data-path={`indir.sistem.win.${i}`}>{r}</li>)}
            </ul>
          </div>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Yol haritası</div>
            <p style={{ ...pStyle, fontSize: 14.5, margin: 0 }} data-he data-path="indir.sistem.not">{sistem.not}</p>
            <p style={{ marginTop: 14, fontSize: 14.5 }}><a href="/sss">Platformlar ve cihaz lisansı hakkında SSS →</a></p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
