// ÜYE — SSR kabuk + istemci auth (piksel referansı: Uye.dc.html). noindex,follow (prototiple aynı).
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle } from '@/components/Chrome';
import UyeAuth from './UyeAuth';

const URL_ = SITE + '/uye';
const SEO = {
  title: 'Üyelik — zerdemkartal',
  description: 'zerdemkartal üyeliği: Astroloji 101 ilerlemen, rozetlerin ve doğum haritası kısayolun tek hesapta.'
};

export const metadata = pageMeta({ ...SEO, path: '/uye', noindex: true });

export default function Uye() {
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': URL_ + '#webpage', url: URL_, name: SEO.title, description: SEO.description, isPartOf: { '@id': SITE + '/#site' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Üyelik', item: URL_ }
    ] }
  ] };

  return (
    <main>
      <JsonLd data={jsonld} />
      <Nav />

      <section style={{ ...sectionStyle, paddingTop: 64, display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 460px)', gap: 48, alignItems: 'start' }}>
        <div>
          <div style={kickerStyle}>ÜYELİK</div>
          <h1 style={h1Style}>İlerlemen, her gökyüzünde <span style={{ color: T.muted }}>seninle</span></h1>
          <p style={pStyle}>Üye ol; Astroloji 101 serin, ustalığın ve rozetlerin bu cihazdan çıkıp hesabına kaydolsun. Kaldığın yerden, hangi cihazda olursan ol devam et.</p>
          <ul style={{ ...pStyle, paddingLeft: 22 }}>
            <li><strong>İlerleme senkronu</strong> — seri, ustalık ve rozetler her cihazda.</li>
            <li><strong>Kaldığın yerden</strong> — günün tekrarı ve destelerin seni bekler.</li>
            <li><strong>Önce sen haberdar ol</strong> — yeni desteler ve kütüphane yazılarından ilk sen.</li>
          </ul>
        </div>
        <UyeAuth />
      </section>

      <Footer />
    </main>
  );
}
