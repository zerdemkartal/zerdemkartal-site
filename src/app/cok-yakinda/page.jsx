import { Nav, Footer, T, btnGhost, btnPrimary, h1Style, kickerStyle, pStyle, sectionStyle } from '@/components/Chrome';
import { pageMeta } from '@/lib/site';

const SEO = {
  title: 'Üye hesabı çok yakında — Hermes',
  description: 'Hermes üye hesabı ve Google ile giriş deneyimi hazırlanıyor.'
};

export const metadata = pageMeta({ ...SEO, path: '/cok-yakinda', noindex: true });

export default function CokYakinda() {
  return (
    <main>
      <Nav />

      <section style={{ ...sectionStyle, maxWidth: 900, paddingTop: 86, textAlign: 'center' }}>
        <div style={kickerStyle}>HERMES HESABI</div>
        <h1 style={{ ...h1Style, fontSize: 'clamp(44px, 7vw, 78px)' }}>
          Çok yakında<span style={{ color: T.accentText }}>.</span>
        </h1>
        <p style={{ ...pStyle, maxWidth: 610, marginLeft: 'auto', marginRight: 'auto' }}>
          Google ile giriş ve Hermes üye hesabı hazırlanıyor. Lisansın, cihazların ve ileride web uygulaması erişimin tek, sade bir hesapta buluşacak.
        </p>

        <div style={{ margin: '42px auto 0', maxWidth: 620, padding: '30px 28px', border: `1px solid ${T.border}`, borderRadius: 22, background: T.card }}>
          <div style={{ fontFamily: T.serif, fontSize: 24, color: T.ink }}>Hazır olduğunda burada olacak</div>
          <p style={{ ...pStyle, fontSize: 15, margin: '10px auto 0' }}>
            Satın alma talebini güvenli formdan iletebilir; ödeme ve lisans adımlarını ekibimizle netleştirebilirsin.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <a href="/" style={btnGhost}>Ana sayfaya dön</a>
            <a href="/satin-al" style={btnPrimary}>Satın al</a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
