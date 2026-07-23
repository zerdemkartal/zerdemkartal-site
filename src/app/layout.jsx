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
        <EditLayer />
      </body>
    </html>
  );
}
