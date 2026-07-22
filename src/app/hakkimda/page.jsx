// HAKKIMDA — SSR portu (piksel referansı: Hakkimizda.dc.html; içerik = PageContent 'hakkimda').
// JSON-LD: prototipteki @graph (Organization/WebSite/AboutPage/BreadcrumbList) + Person.
import { getContent } from '@/lib/content';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, sectionStyle } from '@/components/Chrome';

export const revalidate = 300;

const URL_ = SITE + '/hakkimda';
const SEO_DEF = {
  title: 'Hakkımda — zerdemkartal',
  description: 'zerdemkartal: gökyüzüne bakan, okuyan, yazan ve öğreten bağımsız bir astroloji stüdyosu. Hikâye ve yaklaşım.'
};

const load = () => getContent('hakkimda', {});

export async function generateMetadata() {
  const c = await load();
  const seo = c.seo || {};
  return pageMeta({ title: seo.title || SEO_DEF.title, description: seo.description || SEO_DEF.description, path: '/hakkimda', ogType: 'profile' });
}

export default async function Hakkimda() {
  const c = await load();
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'AboutPage', '@id': URL_ + '#webpage', url: URL_, name: (c.seo && c.seo.title) || SEO_DEF.title, description: (c.seo && c.seo.description) || SEO_DEF.description, isPartOf: { '@id': SITE + '/#site' }, about: { '@id': SITE + '/#org' } },
    { '@type': 'Person', '@id': SITE + '/#astrolog', name: 'zerdemkartal', jobTitle: 'Astrolog', worksFor: { '@id': SITE + '/#org' }, sameAs: ['https://instagram.com/zerdemkartal', 'https://youtube.com/@zerdemkartal'] },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Hakkımda', item: URL_ }
    ] }
  ] };

  return (
    <main>
      <JsonLd data={jsonld} />
      <Nav active="/hakkimda" />

      <section style={{ ...sectionStyle, paddingTop: 84, maxWidth: 920, textAlign: 'center' }}>
        <div style={kickerStyle}>HAKKIMDA</div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 430, fontSize: 'clamp(34px, 4.6vw, 52px)', lineHeight: 1.28, letterSpacing: '-0.02em', margin: '22px 0 0', whiteSpace: 'pre-line' }}>
          {c.statement || '“Hiçliğin peşinde” — gökyüzüne bakan, okuyan, yazan ve öğreten bağımsız bir stüdyo.'}
        </h1>
        <img src="/assets/logo-transparent.png" alt="zerdemkartal logosu" style={{ width: 180, marginTop: 54, display: 'inline-block' }} />
      </section>

      <Footer />
    </main>
  );
}
