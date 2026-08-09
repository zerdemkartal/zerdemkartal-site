// Ortak sayfa iskeleti — HERMES nav + footer (H1 dönüşümü; eski mühürlü zerdemkartal
// nav/footer'ın yerini aldı, kullanıcı onayı 2026-07-19).
// ÇİFT MOD: tüm renkler CSS değişkeni (tanımlar src/app/layout.jsx).
//   Açık mod = eski zerdemkartal aydınlık paleti · Koyu mod = "Meridyen Rasathanesi"
//   (C:\Hermes\temalar\tasarim-onerileri-hermes.md §1). T token'ları var() döndürür,
//   bu yüzden T kullanan her sayfa otomatik iki temada da çalışır.
import ThemeToggle from './ThemeToggle';
import MobileNav from './MobileNav';
// Faz 3 (27 Tem 2026) — yapışkan/akıllı nav sarmalayıcısı + ⌘K komut paleti.
// Nav markup'ı DEĞİŞMEDİ; SmartNav yalnız dıştan sarar (sunucu çocukları prop olarak alır).
import SmartNav from './SmartNav';
import CommandPalette from './CommandPalette';
import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL_NAME,
  COMPANY_TAX_OFFICE,
  COMPANY_TAX_NUMBER_DISPLAY,
  CONTACT_EMAIL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_INFO_URL,
  YOUTUBE_HANDLE,
  YOUTUBE_URL
} from '@/lib/site';

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
  ['/sss', 'SSS']
];

export function Nav({ active }) {
  return (
   <>
    <a href="#h-main" className="h-skip">İçeriğe geç</a>
    <SmartNav>
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
          <a href="/satin-al" style={{ marginLeft: 2, background: T.dark, color: 'var(--h-dark-text)', borderRadius: 999, padding: '9px 16px', fontSize: 14, textDecoration: 'none' }}>Satın al</a>
        </div>
        <CommandPalette />
        <ThemeToggle />
        <MobileNav active={active} />
      </div>
    </nav>
    </SmartNav>
    <span id="h-main" tabIndex={-1} aria-hidden="true" />
   </>
  );
}

export function Footer() {
  return (
    <footer className="h-footer">
      <div className="h-footer-main">
        <div className="h-footer-brand">
          <a href="/" className="h-footer-brandlink" aria-label="Hermes ana sayfa">
            <img src="/assets/hermes-mark.svg" alt="" aria-hidden="true" />
            <span>Hermes</span>
          </a>
          <p>Profesyonel astroloji çalışmalarını tek, sakin ve güvenilir bir çalışma alanında buluşturur.</p>
          <span className="h-footer-note">Windows için profesyonel astroloji programı</span>
        </div>

        <nav className="h-footer-nav" aria-label="Alt menü">
          <span className="h-footer-head">SAYFALAR</span>
          <a href="/ozellikler">Özellikler</a>
          <a href="/fiyat">Fiyat</a>
          <a href="/indir">İndir</a>
          <a href="/sss">Sık sorulan sorular</a>
          <a href="/hakkimda">Geliştiricisi hakkında</a>
        </nav>

        <div className="h-footer-contact">
          <span className="h-footer-head">İLETİŞİM</span>
          <div className="h-footer-contact-list">
            <a href="/iletisim">
              <span className="h-footer-icon" aria-hidden="true">↗</span>
              <span><small>Bize yazın</small>İletişim formu</span>
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <span className="h-footer-icon" aria-hidden="true">@</span>
              <span><small>E-posta</small>{CONTACT_EMAIL}</span>
            </a>
            <a href={WHATSAPP_INFO_URL} target="_blank" rel="noopener noreferrer">
              <span className="h-footer-icon h-footer-icon-wa" aria-hidden="true">W</span>
              <span><small>WhatsApp</small>{WHATSAPP_DISPLAY}</span>
            </a>
          </div>

          <div className="h-footer-social">
            <span className="h-footer-social-label">Bizi takip edin</span>
            <a href={INSTAGRAM_URL} target="_blank" rel="me noopener noreferrer">
              Instagram <span aria-hidden="true">↗</span>
              <small>@{INSTAGRAM_HANDLE}</small>
            </a>
            <a href={YOUTUBE_URL} target="_blank" rel="me noopener noreferrer">
              YouTube <span aria-hidden="true">↗</span>
              <small>@{YOUTUBE_HANDLE}</small>
            </a>
          </div>
        </div>
      </div>

      <div className="h-footer-bottom">
        <div className="h-footer-copy">
          <span>© 2026 zerdemkartal · Hermes Astroloji Programı</span>
          <span className="h-footer-company">{COMPANY_LEGAL_NAME}</span>
          <span className="h-footer-company">{COMPANY_ADDRESS} · {COMPANY_TAX_OFFICE} · Vergi No: {COMPANY_TAX_NUMBER_DISPLAY}</span>
        </div>
        <div className="h-footer-legal">
          <a href="/yasal/kvkk">KVKK</a>
          <a href="/yasal/gizlilik">Gizlilik &amp; Çerez</a>
          <a href="/yasal/on-bilgilendirme">Ön Bilgilendirme</a>
          <a href="/yasal/teslimat">Teslimat Koşulları</a>
          <a href="/yasal/mesafeli-satis">Mesafeli Satış</a>
          <a href="/yasal/iade">İptal &amp; İade</a>
        </div>
      </div>
    </footer>
  );
}

export function Kicker({ children }) { return <div style={kickerStyle}>{children}</div>; }
