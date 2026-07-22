// Ortak sayfa iskeleti — HERMES nav + footer (H1 dönüşümü; eski mühürlü zerdemkartal
// nav/footer'ın yerini aldı, kullanıcı onayı 2026-07-19).
// ÇİFT MOD: tüm renkler CSS değişkeni (tanımlar src/app/layout.jsx).
//   Açık mod = eski zerdemkartal aydınlık paleti · Koyu mod = "Meridyen Rasathanesi"
//   (C:\Hermes\temalar\tasarim-onerileri-hermes.md §1). T token'ları var() döndürür,
//   bu yüzden T kullanan her sayfa otomatik iki temada da çalışır.
import ThemeToggle from './ThemeToggle';
import MobileNav from './MobileNav';

export const T = {
  ink: 'var(--h-ink)', ink2: 'var(--h-ink2)', paper: 'var(--h-bg)', cream: 'var(--h-cream)',
  card: 'var(--h-card)', border: 'var(--h-border)', muted: 'var(--h-muted)',
  purple: 'var(--h-accent)', accentText: 'var(--h-accent-text)', accentInk: 'var(--h-accent-ink)',
  accentBg: 'var(--h-accentbg)', gold: 'var(--h-gold)', dark: 'var(--h-dark)',
  serif: "'Newsreader', serif", sans: "'Hanken Grotesk', sans-serif", nav: "'Gotham', 'Montserrat', sans-serif"
};

export const kickerStyle = { fontSize: 12.5, fontWeight: 700, letterSpacing: '0.22em', color: T.muted };
export const h1Style = { fontFamily: T.serif, fontWeight: 430, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: '14px 0 0' };
export const h2Style = { fontFamily: T.serif, fontWeight: 460, fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: 1.1, letterSpacing: '-0.02em', margin: '12px 0 0' };
export const pStyle = { fontSize: 16.5, lineHeight: 1.75, color: T.ink2, maxWidth: 640, margin: '16px 0 0' };
export const sectionStyle = { maxWidth: 1160, margin: '0 auto', padding: '72px 32px 0' };
export const cardStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: 24 };
export const btnPrimary = { background: T.accentText, color: T.accentInk, borderRadius: 999, padding: '14px 28px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' };
export const btnGhost = { border: `1px solid ${T.border}`, color: T.ink, borderRadius: 999, padding: '14px 28px', textDecoration: 'none', display: 'inline-block' };

const LINKS = [
  ['/ozellikler', 'Özellikler'],
  ['/fiyat', 'Fiyat'],
  ['/indir', 'İndir'],
  ['/blog', 'Blog'],
  ['/sss', 'SSS']
];

export function Nav({ active }) {
  return (
   <>
    <a href="#h-main" className="h-skip">İçeriğe geç</a>
    <nav aria-label="Ana gezinme" style={{ position: 'relative', zIndex: 20, maxWidth: 1240, margin: '26px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--h-navbg)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: 20, padding: '14px 12px 14px 18px', boxShadow: '0 1px 2px var(--h-shadow), 0 10px 30px var(--h-shadow)' }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: T.ink }}>
        <img src="/assets/hermes-mark.svg" alt="Hermes kadüse logosu" style={{ width: 40, height: 38, display: 'block' }} />
        <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em' }}>Hermes</span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="h-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: T.nav, fontSize: 15.5, fontWeight: 500, color: T.ink2, whiteSpace: 'nowrap' }}>
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} style={href === active
              ? { color: T.accentText, textDecoration: 'underline', textUnderlineOffset: 6 }
              : { color: 'inherit', textDecoration: 'none' }}>{label}</a>
          ))}
          <a href="/uye" style={{ marginLeft: 2, background: T.dark, color: 'var(--h-dark-text)', borderRadius: 999, padding: '9px 16px', fontSize: 14, textDecoration: 'none' }}>Üye girişi</a>
        </div>
        <ThemeToggle />
        <MobileNav active={active} />
      </div>
    </nav>
    <span id="h-main" tabIndex={-1} aria-hidden="true" />
   </>
  );
}

export function Footer() {
  const fl = { color: 'var(--h-dark-text)', textDecoration: 'none' };
  const legal = { color: 'var(--h-dark-muted)', textDecoration: 'none' };
  const colHead = { fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--h-dark-muted)' };
  return (
    <footer style={{ background: T.dark, color: 'var(--h-dark-text)', borderRadius: '44px 44px 0 0', padding: '96px 0 0', overflow: 'hidden', marginTop: 100 }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 0.6fr', gap: 60 }}>
        <div>
          <img src="/assets/hermes-mark.svg" alt="Hermes kadüse logosu" style={{ width: 74, height: 70, display: 'block' }} />
          <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 24, lineHeight: 1.5, color: 'var(--h-dark-text2)', maxWidth: 420, margin: '24px 0 0' }}>Hermes — gökyüzünü masaüstüne indiren astroloji programı. zerdemkartal atölyesinden.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15.5 }}>
          <span style={colHead}>SAYFALAR</span>
          <a href="/ozellikler" style={fl}>Özellikler</a>
          <a href="/fiyat" style={fl}>Fiyat</a>
          <a href="/indir" style={fl}>İndir</a>
          <a href="/blog" style={fl}>Blog</a>
          <a href="/sss" style={fl}>SSS</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15.5 }}>
          <span style={colHead}>İLETİŞİM</span>
          <a href="/iletisim" style={fl}>İletişim formu</a>
          <a href="mailto:merhaba@zerdemkartal.com" style={fl}>merhaba@zerdemkartal.com</a>
          <a href="/hakkimda" style={fl}>Geliştiricisi hakkında</a>
          <a href="https://instagram.com/zerdemkartal" target="_blank" rel="me noopener" style={fl}>Instagram</a>
          <a href="https://youtube.com/@zerdemkartal" target="_blank" rel="me noopener" style={fl}>YouTube</a>
        </div>
      </div>
      <div aria-hidden="true" style={{ textAlign: 'center', marginTop: 60, lineHeight: 0.78, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: T.serif, fontWeight: 420, fontSize: 'clamp(110px, 21vw, 300px)', letterSpacing: '-0.03em', color: 'var(--h-dark-wordmark)' }}>Hermes</span>
      </div>
      <div style={{ borderTop: '1px solid var(--h-dark-border)', marginTop: -14, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px 18px', fontSize: 13.5, color: 'var(--h-dark-muted)' }}>
        <span>© 2026 zerdemkartal · Hermes Astroloji Programı</span>
        <span style={{ display: 'inline-flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="/yasal/kvkk" style={legal}>KVKK</a>
          <a href="/yasal/gizlilik" style={legal}>Gizlilik &amp; Çerez</a>
          <a href="/yasal/mesafeli-satis" style={legal}>Mesafeli Satış</a>
          <a href="/yasal/iade" style={legal}>İptal &amp; İade</a>
        </span>
        <span>İstanbul&#39;dan, gökyüzü altında yapıldı ☿&#xFE0E;</span>
      </div>
    </footer>
  );
}

export function Kicker({ children }) { return <div style={kickerStyle}>{children}</div>; }
