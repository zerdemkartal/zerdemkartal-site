// Ortak sayfa iskeleti — MÜHÜRLÜ nav + footer'ın SSR portu.
// Piksel referansı: prototip .dc.html dosyaları (cam efektli nav, koyu #1D130B footer).
// Linkler temiz URL'lere çevrildi (.dc.html → route).

export const T = {
  ink: '#2B1D12', ink2: '#3A2D20', paper: '#FBFAF7', cream: '#F4F1E8',
  border: '#E8E3D6', muted: '#6B675E', purple: '#8E7CC3', dark: '#1D130B',
  serif: "'Newsreader', serif", sans: "'Hanken Grotesk', sans-serif", nav: "'Gotham', 'Montserrat', sans-serif"
};

export const kickerStyle = { fontSize: 12.5, fontWeight: 700, letterSpacing: '0.22em', color: T.muted };
export const h1Style = { fontFamily: T.serif, fontWeight: 430, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: '14px 0 0' };
export const h2Style = { fontFamily: T.serif, fontWeight: 460, fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: 1.1, letterSpacing: '-0.02em', margin: '12px 0 0' };
export const pStyle = { fontSize: 16.5, lineHeight: 1.75, color: T.ink2, maxWidth: 640, margin: '16px 0 0' };
export const sectionStyle = { maxWidth: 1160, margin: '0 auto', padding: '72px 32px 0' };

const LINKS = [
  ['/danismanliklar', 'Danışmanlıklar'],
  ['/programlar', 'Programlar'],
  ['/astroloji-101', 'Astroloji 101'],
  ['/blog', 'Blog'],
  ['/dogum-haritasi', 'Doğum Haritası'],
  ['/hakkimda', 'Hakkımda']
];

export function Nav({ active }) {
  return (
    <nav aria-label="Ana gezinme" style={{ position: 'relative', zIndex: 20, maxWidth: 1240, margin: '26px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: 20, padding: '12px 12px 12px 16px', boxShadow: '0 1px 2px rgba(43,29,18,0.05), 0 10px 30px rgba(43,29,18,0.06)' }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: T.ink }}>
        <img src="/assets/logo-transparent.png" alt="zerdemkartal logosu" style={{ width: 92, height: 92, margin: '-14px 0' }} />
        <span style={{ fontFamily: T.serif, fontSize: 29, fontWeight: 600, letterSpacing: '-0.01em' }}>zerdemkartal</span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, fontFamily: T.nav, fontSize: 15.5, fontWeight: 500, color: T.ink2, whiteSpace: 'nowrap' }}>
        {LINKS.map(([href, label]) => (
          <a key={href} href={href} style={href === active
            ? { color: T.purple, textDecoration: 'underline', textUnderlineOffset: 6 }
            : { color: 'inherit', textDecoration: 'none' }}>{label}</a>
        ))}
        <a href="/uye" style={{ marginLeft: 4, background: T.dark, color: '#F5F1E6', borderRadius: 999, padding: '9px 16px', fontSize: 14, textDecoration: 'none' }}>Üye ol</a>
      </div>
    </nav>
  );
}

export function Footer() {
  const fl = { color: '#EDE7DA', textDecoration: 'none' };
  const legal = { color: '#8A867B', textDecoration: 'none' };
  return (
    <footer style={{ background: T.dark, color: '#EDE7DA', borderRadius: '44px 44px 0 0', padding: '96px 0 0', overflow: 'hidden', marginTop: 100 }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 0.6fr', gap: 60 }}>
        <div>
          <img src="/assets/logo-white.png" alt="zerdemkartal logosu" style={{ width: 104, height: 104, margin: '-14px 0 0 -10px', display: 'block' }} />
          <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 24, lineHeight: 1.5, color: '#D8D2C2', maxWidth: 420, margin: '24px 0 0' }}>zerdemkartal — gökyüzüne bakan, okuyan, yazan ve öğreten bağımsız bir stüdyo.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15.5 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#8A867B' }}>SAYFALAR</span>
          <a href="/danismanliklar" style={fl}>Danışmanlıklar</a>
          <a href="/programlar" style={fl}>Programlar</a>
          <a href="/astroloji-101" style={fl}>Astroloji 101</a>
          <a href="/blog" style={fl}>Blog</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15.5 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#8A867B' }}>İLETİŞİM</span>
          <a href="/iletisim" style={fl}>İletişim formu</a>
          <a href="mailto:merhaba@zerdemkartal.com" style={fl}>merhaba@zerdemkartal.com</a>
          <a href="https://instagram.com/zerdemkartal" target="_blank" rel="me noopener" style={fl}>Instagram</a>
          <a href="https://youtube.com/@zerdemkartal" target="_blank" rel="me noopener" style={fl}>YouTube</a>
        </div>
      </div>
      <div aria-hidden="true" style={{ textAlign: 'center', marginTop: 60, lineHeight: 0.78, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: T.serif, fontWeight: 420, fontSize: 'clamp(90px, 15.5vw, 232px)', letterSpacing: '-0.03em', color: '#F5F1E6' }}>zerdemkartal</span>
      </div>
      <div style={{ borderTop: '1px solid #33271A', marginTop: -14, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px 18px', fontSize: 13.5, color: '#8A867B' }}>
        <span>© 2026 zerdemkartal · Hermes Astroloji</span>
        <span style={{ display: 'inline-flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="/yasal/kvkk" style={legal}>KVKK</a>
          <a href="/yasal/gizlilik" style={legal}>Gizlilik &amp; Çerez</a>
          <a href="/yasal/mesafeli-satis" style={legal}>Mesafeli Satış</a>
          <a href="/yasal/iade" style={legal}>İptal &amp; İade</a>
        </span>
        <span>İstanbul&#39;dan, gökyüzü altında yapıldı ✳</span>
      </div>
    </footer>
  );
}

export function Kicker({ children }) { return <div style={kickerStyle}>{children}</div>; }
