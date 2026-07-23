// Kök layout — fontlar + tema. TÜM CSS burada inline <style> ile (çift mod token'ları +
// responsive + erişilebilirlik + mobil nav). NOT: CSS bilinçli olarak inline; ayrı globals.css
// import'u bazı dev/build durumlarında yüklenmeyip tüm --h-* değişkenlerini düşürdü (kartlar
// kayboldu, tema düğmesi bozuldu) → inline <style> ilk HTML'de garanti render olur.
// Açık mod = zerdemkartal aydınlık paleti · Koyu mod = "Meridyen Rasathanesi".
import EditLayer from '@/components/EditLayer';

export const metadata = {
  title: 'Hermes',
  icons: {
    icon: [{ url: '/assets/favicon.png', type: 'image/png' }, { url: '/assets/favicon.ico', sizes: 'any' }],
    apple: '/assets/apple-touch-icon.png'
  }
};

const THEME_CSS = `
  :root {
    --h-bg:#FBFAF7; --h-card:#FFFFFF; --h-cream:#F4F1E8;
    --h-border:#E8E3D6; --h-border2:#D9D2C2;
    --h-ink:#2B1D12; --h-ink2:#3A2D20; --h-muted:#6B675E;
    --h-accent:#8E7CC3; --h-accent-text:#6B4FA0; --h-accent-hover:#543D82; --h-accent-ink:#F5F1E6;
    --h-accentbg:#DCE7DB; --h-tint:#EEEAF6; --h-tint-ink:#5B4E86; --h-gold:#98783B;
    --h-dark:#1D130B; --h-dark-text:#EDE7DA; --h-dark-text2:#D8D2C2;
    --h-dark-muted:#8A867B; --h-dark-border:#33271A; --h-dark-wordmark:#F5F1E6;
    --h-sel:#E4DAF6; --h-shadow:rgba(43,29,18,0.06); --h-navbg:rgba(255,255,255,0.6);
    --h-veil1:rgba(251,250,247,0.86); --h-veil2:rgba(251,250,247,0.42);
    --h-neon1:rgba(142,77,103,0.45); --h-neon2:rgba(152,120,59,0.28);
  }
  html[data-theme="dark"] {
    --h-bg:#10141B; --h-card:#181D25; --h-cream:#222832;
    --h-border:#313844; --h-border2:#46505F;
    --h-ink:#ECE8DF; --h-ink2:#C6BFB2; --h-muted:#9A9285;
    --h-accent:#C792A8; --h-accent-text:#C792A8; --h-accent-hover:#DBACBE; --h-accent-ink:#14101A;
    --h-accentbg:#30242D; --h-tint:#30242D; --h-tint-ink:#C792A8; --h-gold:#BEA36B;
    --h-dark:#0B0E13; --h-dark-text:#E6E3DB; --h-dark-text2:#B9B1A5;
    --h-dark-muted:#877F75; --h-dark-border:#313844; --h-dark-wordmark:#ECE8DF;
    --h-sel:#30242D; --h-shadow:rgba(0,0,0,0.35); --h-navbg:rgba(16,20,27,0.66);
    --h-veil1:rgba(16,20,27,0.82); --h-veil2:rgba(16,20,27,0.42);
    --h-neon1:rgba(199,146,168,0.55); --h-neon2:rgba(190,163,107,0.30);
  }
  html { scroll-behavior:smooth; }
  body { background:var(--h-bg); color:var(--h-ink); transition:background .25s ease, color .25s ease; }
  ::selection { background:var(--h-sel); color:var(--h-ink); }
  a { color:var(--h-accent-text); }
  a:hover { color:var(--h-accent-hover); }
  .zk-hover-card { transition:box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
  .zk-hover-card:hover { border-color:var(--h-accent) !important; box-shadow:0 0 0 3px var(--h-sel), 0 16px 36px var(--h-shadow); transform:translateY(-2px); }

  /* Görünür odak halkası (WCAG 2.4.7) */
  :focus-visible { outline:2px solid var(--h-accent-text); outline-offset:2px; border-radius:4px; }
  :focus:not(:focus-visible) { outline:none; }

  /* İçeriğe geç bağlantısı (WCAG 2.4.1) */
  .h-skip { position:absolute; left:-9999px; top:0; z-index:999; background:var(--h-card); color:var(--h-ink);
    border:1px solid var(--h-border); border-radius:10px; padding:10px 16px; text-decoration:none; }
  .h-skip:focus { left:12px; top:12px; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; }
  }

  /* Mobilde bölüm yan boşlukları daralır */
  @media (max-width:640px) { main > section { padding-left:20px !important; padding-right:20px !important; } }

  /* Masaüstü nav linkleri / mobil hamburger geçişi */
  .h-burger { display:none; }
  @media (max-width:900px) {
    .h-desktop-nav { display:none !important; }
    .h-burger { display:grid !important; }
  }
  .h-desktop-nav a { padding:6px 2px; }

  /* Mobil nav çekmecesi */
  .h-burger { width:42px; height:42px; border-radius:12px; border:1px solid var(--h-border);
    background:var(--h-card); color:var(--h-ink); cursor:pointer; place-items:center; padding:0; }
  .h-burger svg { width:20px; height:20px; }
  .h-drawer { position:fixed; inset:0; z-index:200; display:flex; flex-direction:column;
    background:var(--h-bg); padding:20px 24px 32px; animation:h-fade .18s ease; }
  .h-drawer-top { display:flex; align-items:center; justify-content:space-between; }
  .h-drawer nav { display:flex; flex-direction:column; gap:4px; margin-top:32px; }
  .h-drawer a { font-family:'Newsreader', serif; font-size:26px; color:var(--h-ink);
    text-decoration:none; padding:14px 6px; border-bottom:1px solid var(--h-border); }
  .h-drawer a.on { color:var(--h-accent-text); }
  .h-drawer a[data-cta] { margin-top:20px; border:none; background:var(--h-dark); color:var(--h-dark-text);
    border-radius:999px; text-align:center; font-family:'Hanken Grotesk', sans-serif; font-size:17px; }
  @keyframes h-fade { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }

  /* Hero — ortalanmış içerik + arkada canlı ZODYAK LOTTIE animasyonu (HeroLottie.jsx) + neon parıltı */
  .hero { position:relative; overflow:hidden; }
  .hero-inner { position:relative; z-index:1; }
  .hero-lottie { position:absolute; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
  /* Üstten ortalı: grup yatayda merkez, dikeyde hero'nun üst kısmında (başlığın arkasında) */
  .hero-lottie-svg, .hero-emblem { position:absolute; left:50%; top:33%; transform:translate(-50%,-50%); }
  .hero-lottie-svg { width:min(64vw,520px); height:min(64vw,520px); opacity:.5; }
  html[data-theme="dark"] .hero-lottie-svg { opacity:.62; }
  /* Neon parıltı: Lottie SVG'sine gül+pirinç halesi */
  .hero-lottie-svg svg { filter:drop-shadow(0 0 5px var(--h-neon1)) drop-shadow(0 0 14px var(--h-neon2)); }
  /* Merkezde tek HERMES glifi (zodyak glifleri kaldırıldı) — hafif nefes + neon hale */
  .hero-emblem { width:min(23vw,166px); height:auto; opacity:.16;
    filter:drop-shadow(0 0 8px var(--h-neon1)) drop-shadow(0 0 20px var(--h-neon2));
    animation:emblemPulse 8s ease-in-out infinite; will-change:transform; }
  html[data-theme="dark"] .hero-emblem { opacity:.24; }
  @keyframes emblemPulse { 0%,100% { transform:translate(-50%,-50%) scale(1); } 50% { transform:translate(-50%,-50%) scale(1.06); } }
  /* Metin okunabilirliği için merkezî perde (animasyonla aynı hizada, üstte) */
  .hero-veil { position:absolute; inset:0; background:radial-gradient(circle at 50% 33%, var(--h-veil1) 0%, var(--h-veil2) 32%, transparent 64%); }
  @media (max-width:720px) { .hero-lottie-svg { width:120vw; height:120vw; } .hero-emblem { width:42vw; } }

  /* Yerinde düzenleme (EditLayer, /yonetim girişi sonrası) — düzenlenebilir alan vurgusu */
  [data-he].he-on { outline:1.5px dashed var(--h-accent); outline-offset:3px; border-radius:3px; cursor:text; }
  [data-he].he-on:hover { background:var(--h-sel); }
  [data-he].he-on:focus { outline:2px solid var(--h-accent-text); outline-offset:3px; }

  /* WhatsApp — "program hakkında soru sor" (sabit, sol alt; EditLayer sağ altta olduğu için çakışmaz) */
  .h-wa { position:fixed; left:16px; bottom:16px; z-index:120; display:inline-flex; align-items:center; gap:9px;
    background:#25D366; color:#fff; text-decoration:none; border-radius:999px; padding:11px 17px 11px 14px;
    font-family:'Hanken Grotesk', sans-serif; font-size:14.5px; font-weight:600; box-shadow:0 8px 24px rgba(0,0,0,0.20); }
  .h-wa:hover { background:#1EB854; color:#fff; }
  .h-wa svg { width:22px; height:22px; flex:none; }
  @media (max-width:640px) { .h-wa { padding:13px; left:14px; bottom:14px; } .h-wa span { display:none; } }
`;

// İlk boya ÖNCESİ tema tespiti (FOUC yok): localStorage 'h_tema' → prefers-color-scheme.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('h_tema');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: "'Hanken Grotesk', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Hanken+Grotesk:ital,wght@0,400..700;1,400&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
        {children}
        <a className="h-wa" href="https://wa.me/905454564275?text=Merhaba!%20Hermes%20program%C4%B1%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" aria-label="WhatsApp'tan Hermes hakkında soru sor">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.005c6.585 0 11.946-5.335 11.949-11.893a11.821 11.821 0 00-3.484-8.413z"/></svg>
          <span>Soru sor</span>
        </a>
        <EditLayer />
      </body>
    </html>
  );
}
