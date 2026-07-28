// FİYAT — tek lisans, her platform (H1). İçerik: 'hermes_site' → fiyat.
// CTA geçici olarak WhatsApp'a gider; iyzico sipariş/ödeme kodu ileride etkinleştirilecektir.
// JSON-LD: WebPage + Breadcrumb + SoftwareApplication(Offer) + FAQPage (fiyat SSS).
import { getHermes } from '@/lib/hermesContent';
import { SITE, ORG, WEBSITE, WHATSAPP_PURCHASE_URL, appNode, pageMeta, priceNum } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, btnPrimary, kickerStyle, h1Style, h2Style, pStyle, sectionStyle } from '@/components/Chrome';
// Faz 2 (27 Tem 2026) — fiyat kutusunda imleç parıltısı.
import Spotlight from '@/components/Spotlight';

export const revalidate = 300;
const PATH = '/fiyat';

export async function generateMetadata() {
  const c = await getHermes();
  return pageMeta({ ...c.seo.fiyat, path: PATH });
}

function buildJsonLd(c) {
  const seo = c.seo.fiyat;
  return { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': SITE + PATH + '#webpage', url: SITE + PATH, name: seo.title, description: seo.description, inLanguage: 'tr-TR', isPartOf: { '@id': SITE + '/#site' }, about: { '@id': SITE + '/#hermes' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Fiyat', item: SITE + PATH }
    ] },
    appNode({ description: seo.description, price: priceNum(c.fiyat.kutu.price) || '6000' }),
    { '@type': 'FAQPage', mainEntity: (c.fiyat.sss || []).map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }
  ] };
}

export default async function Fiyat() {
  const c = await getHermes();
  const { hero, kutu, tekLisans, sss } = c.fiyat;

  return (
    <main>
      <JsonLd data={buildJsonLd(c)} />
      <Nav active={PATH} />

      <section className="h-price-hero">
        <div className="h-price-copy">
          <div style={kickerStyle} data-he data-path="fiyat.hero.kicker">{hero.kicker}</div>
          <h1 style={h1Style} data-he data-path="fiyat.hero.title">{hero.title}</h1>
          <p style={pStyle} data-he data-path="fiyat.hero.p">{hero.p}</p>
          <div className="h-price-assurance" aria-label="Lisans özeti">
            <span>Abonelik yok</span>
            <span>1 cihaz lisansı</span>
            <span>Güncellemeler dahil</span>
          </div>
        </div>

        {/* FİYAT KUTUSU — Faz 2: imleç parıltısı (satın alma kartı öne çıksın) */}
        <Spotlight id="on-satis" className="h-price-card" style={{ background: T.card, border: `1.5px solid ${T.purple}` }} tilt={3}>
          <div style={{ ...kickerStyle, color: T.accentText }} data-he data-path="fiyat.kutu.kicker">{kutu.kicker}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 12 }}>
            <span style={{ fontFamily: T.serif, fontSize: 46 }} data-he data-path="fiyat.kutu.price">{kutu.price}</span>
            {kutu.oldPrice && <s style={{ color: T.muted, fontSize: 20 }} data-he data-path="fiyat.kutu.oldPrice">{kutu.oldPrice}</s>}
          </div>
          <div className="h-device-pricing">
            <strong>Program fiyatı: <span data-he data-path="fiyat.kutu.oldPrice">{kutu.oldPrice || '₺8.500'}</span></strong>
            <span>İkinci cihaz lisansı: <b data-he data-path="fiyat.kutu.secondLicensePrice">+{kutu.secondLicensePrice || '₺2.500'}</b></span>
            <span>İki cihaz toplam: <b data-he data-path="fiyat.kutu.secondPrice">{kutu.secondPrice || '₺8.500'}</b></span>
            <span data-he data-path="fiyat.kutu.vatNote">{kutu.vatNote || 'Fiyatlara KDV dahildir.'}</span>
          </div>
          <a
            href={WHATSAPP_PURCHASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btnPrimary, display: 'block', marginTop: 22, textAlign: 'center' }}
          >
            WhatsApp’tan satın al
          </a>
          <div className="h-payment-note">Satın alma görüşmesi WhatsApp üzerinden · iyzico yakında</div>
          <ul style={{ ...pStyle, fontSize: 14.5, paddingLeft: 20 }}>
            {(kutu.rows || []).map((r, i) => <li key={i} style={{ listStyle: 'none', marginLeft: -20 }} data-he data-path={`fiyat.kutu.rows.${i}`}>{r}</li>)}
          </ul>
          <div style={{ color: T.muted, fontSize: 13.5, marginTop: 14 }}>Cihaz seçimini ve ödeme adımlarını WhatsApp görüşmesinde birlikte netleştiririz.</div>
        </Spotlight>
      </section>

      <section style={{ ...sectionStyle, maxWidth: 920 }}>
        {/* TEK LİSANS HER PLATFORM */}
        <div className="h-license-card" style={{ background: T.cream, border: `1px solid ${T.border}` }}>
          <h2 style={{ ...h2Style, fontSize: 26, margin: 0 }} data-he data-path="fiyat.tekLisans.title">{tekLisans.title}</h2>
          <p style={{ ...pStyle, fontSize: 15 }} data-he data-path="fiyat.tekLisans.p">{tekLisans.p}</p>
          <ul style={{ ...pStyle, fontSize: 14.5, paddingLeft: 20 }}>
            {(tekLisans.rows || []).map((r, i) => <li key={i} data-he data-path={`fiyat.tekLisans.rows.${i}`}>{r}</li>)}
          </ul>
        </div>
      </section>

      {(sss || []).length > 0 && (
        <section style={sectionStyle}>
          <h2 style={{ ...h2Style, textAlign: 'center' }}>Fiyat hakkında sorular</h2>
          <div style={{ marginTop: 22, maxWidth: 780 }}>
            {sss.map((q, i) => (
              <details key={i} style={{ borderBottom: `1px solid ${T.border}`, padding: '16px 4px' }}>
                <summary style={{ fontFamily: T.serif, fontSize: 18, cursor: 'pointer' }} data-he data-path={`fiyat.sss.${i}.q`}>{q.q}</summary>
                <p style={{ ...pStyle, fontSize: 15 }} data-he data-path={`fiyat.sss.${i}.a`}>{q.a}</p>
              </details>
            ))}
          </div>
          <p style={{ marginTop: 20 }}><a href="/sss">Tüm sık sorulanlar →</a></p>
        </section>
      )}

      <Footer />
    </main>
  );
}
