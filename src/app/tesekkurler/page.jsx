// /tesekkurler — iyzico ödemesi başarılıysa callback buraya 303 yönlendirir.
// SSR; içerik statik. noindex (işlem sonucu sayfası, dizine girmemeli).
import { SITE } from '@/lib/site';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle, btnPrimary, btnGhost } from '@/components/Chrome';

export const metadata = {
  title: 'Teşekkürler · Hermes',
  description: 'Ödemen alındı — Hermes kurulum adımların.',
  alternates: { canonical: SITE + '/tesekkurler' },
  robots: { index: false, follow: true }
};

export default function Tesekkurler() {
  return (
    <main>
      <Nav active="/tesekkurler" />
      <section style={{ ...sectionStyle, paddingTop: 80, paddingBottom: 40, textAlign: 'center', maxWidth: 720 }}>
        <div style={kickerStyle}>ÖDEME ALINDI</div>
        <h1 style={h1Style}>Teşekkürler ☿&#xFE0E;</h1>
        <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }}>
          Ödemen alındı ve siparişin oluşturuldu. Kurulum dosyası ve lisans etkinleştirme adımların e-posta
          adresine iletildi. Dilersen hemen indirmeye başlayabilirsin.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <a href="/indir" style={btnPrimary}>Hermes'i indir</a>
          <a href="/sss" style={btnGhost}>Kurulum & SSS</a>
        </div>
        <p style={{ fontSize: 13.5, color: T.muted, marginTop: 26 }}>
          E-posta birkaç dakika içinde gelmezse spam klasörünü kontrol et ya da{' '}
          <a href="/iletisim" style={{ color: T.accentText }}>iletişim</a> formundan yaz.
        </p>
      </section>
      <Footer />
    </main>
  );
}
