// İLETİŞİM — SSR portu (piksel referansı: Iletisim.dc.html). Form istemci bileşeni → POST /api/leads.
import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL_NAME,
  COMPANY_TAX_OFFICE,
  COMPANY_TAX_NUMBER_DISPLAY,
  CONTACT_EMAIL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  SITE,
  ORG,
  WEBSITE,
  WHATSAPP_DISPLAY,
  WHATSAPP_INFO_URL,
  YOUTUBE_HANDLE,
  YOUTUBE_URL,
  pageMeta
} from '@/lib/site';
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
          <a href={`mailto:${CONTACT_EMAIL}`} style={card}>
            <div style={{ ...kickerStyle, fontSize: 11.5 }}>E-POSTA</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, marginTop: 8 }}>{CONTACT_EMAIL}</div>
          </a>
          <a href={WHATSAPP_INFO_URL} target="_blank" rel="noopener noreferrer" style={card}>
            <div style={{ ...kickerStyle, fontSize: 11.5 }}>WHATSAPP</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, marginTop: 8 }}>{WHATSAPP_DISPLAY}</div>
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="me noopener noreferrer" style={card}>
            <div style={{ ...kickerStyle, fontSize: 11.5 }}>INSTAGRAM</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, marginTop: 8 }}>@{INSTAGRAM_HANDLE}</div>
          </a>
          <a href={YOUTUBE_URL} target="_blank" rel="me noopener noreferrer" style={card}>
            <div style={{ ...kickerStyle, fontSize: 11.5 }}>YOUTUBE</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, marginTop: 8 }}>@{YOUTUBE_HANDLE}</div>
          </a>
          <div style={card}>
            <div style={{ ...kickerStyle, fontSize: 11.5 }}>ŞİRKET BİLGİLERİ</div>
            <div style={{ fontFamily: T.serif, fontSize: 19, lineHeight: 1.35, marginTop: 8 }}>{COMPANY_LEGAL_NAME}</div>
            <div style={{ color: T.ink2, fontSize: 14, lineHeight: 1.65, marginTop: 8 }}>{COMPANY_TAX_OFFICE}</div>
            <div style={{ color: T.ink2, fontSize: 14, lineHeight: 1.65, marginTop: 2 }}>Vergi No: {COMPANY_TAX_NUMBER_DISPLAY}</div>
            <address style={{ color: T.ink2, fontSize: 14, lineHeight: 1.65, marginTop: 4, fontStyle: 'normal' }}>{COMPANY_ADDRESS}</address>
          </div>
        </div>
        <IletisimForm />
      </section>

      <Footer />
    </main>
  );
}
