// İLETİŞİM — SSR portu (piksel referansı: Iletisim.dc.html). Form istemci bileşeni → POST /api/leads.
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle } from '@/components/Chrome';
import IletisimForm from './IletisimForm';

const URL_ = SITE + '/iletisim';
const SEO = {
  title: 'İletişim — Hermes',
  description: 'Hermes hakkında sorular, satın alma ve iş birliği için yaz: iletişim formu, e-posta ve sosyal hesaplar.'
};

export const metadata = pageMeta({ ...SEO, path: '/iletisim' });

export default function Iletisim() {
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'ContactPage', '@id': URL_ + '#webpage', url: URL_, name: SEO.title, description: SEO.description, isPartOf: { '@id': SITE + '/#site' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'İletişim', item: URL_ }
    ] }
  ] };

  const card = { display: 'block', background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: '20px 24px', color: T.ink, textDecoration: 'none' };

  return (
    <main>
      <JsonLd data={jsonld} />
      <Nav active="/iletisim" />

      <section style={{ ...sectionStyle, paddingTop: 64 }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
          <div style={kickerStyle}>İLETİŞİM</div>
          <h1 style={h1Style}>Gökyüzü hakkında <span style={{ color: T.muted }}>konuşalım</span></h1>
          <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }}>Hermes hakkında bir soru, satın alma, iş birliği ya da aklına takılan herhangi bir şey — yaz, en geç iki iş günü içinde dönüş yapılır.</p>
        </div>
      </section>

      <section style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: 'minmax(260px, 380px) 1fr', gap: 40, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <a href="mailto:merhaba@zerdemkartal.com" style={card}>
            <div style={{ ...kickerStyle, fontSize: 11.5 }}>E-POSTA</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, marginTop: 8 }}>merhaba@zerdemkartal.com</div>
          </a>
          <a href="https://instagram.com/zerdemkartal" target="_blank" rel="me noopener" style={card}>
            <div style={{ ...kickerStyle, fontSize: 11.5 }}>INSTAGRAM</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, marginTop: 8 }}>@zerdemkartal</div>
          </a>
          <a href="https://youtube.com/@zerdemkartal" target="_blank" rel="me noopener" style={card}>
            <div style={{ ...kickerStyle, fontSize: 11.5 }}>YOUTUBE</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, marginTop: 8 }}>@zerdemkartal</div>
          </a>
        </div>
        <IletisimForm />
      </section>

      <Footer />
    </main>
  );
}
