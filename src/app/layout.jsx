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
    color-scheme: light;
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
  /* KOYU = VARSAYILAN. 'html:not([data-theme])' JS kapalıyken de koyu açılmasını garanti eder;
     THEME_INIT normalde data-theme'i zaten koyu basar. Açık mod yalnız ziyaretçi düğmeye basınca. */
  html:not([data-theme]), html[data-theme="dark"] {
    color-scheme: dark;
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

  /* ——— KAYDIRMADA BELİRİŞ (Reveal.jsx) — Faz 1, 27 Tem 2026 ———
     Kritik güvence: gizleme YALNIZCA <html class="h-js"> varken uygulanır. Sınıfı
     layout'taki blocking init script'i ekler → JS kapalıysa/bot ham HTML okuyorsa
     içerik olduğu gibi görünür (SEO/GEO ve erişilebilirlik kaybı yok).
     Gecikme (stagger) --h-rd değişkeniyle, bileşenden verilir. */
  html.h-js .h-reveal { opacity:0; transform:translateY(20px); }
  html.h-js .h-reveal.is-in { opacity:1; transform:none;
    transition:opacity .6s cubic-bezier(.22,.61,.36,1) var(--h-rd,0ms),
               transform .6s cubic-bezier(.22,.61,.36,1) var(--h-rd,0ms); }
  /* Izgara içinde sarmalayıcı kullanıldığında kartların eşit boyda kalması için */
  .h-reveal.h-r-fill { display:flex; }
  .h-reveal.h-r-fill > * { flex:1 1 auto; }
  @media (prefers-reduced-motion: reduce) {
    html.h-js .h-reveal { opacity:1 !important; transform:none !important; }
  }

  /* Çapa hedefleri (#motor, #zamanlama…) yapışkan üst alana girmesin */
  section[id] { scroll-margin-top:96px; }

  /* ——— KART ETKİLEŞİMİ (Spotlight.jsx) — Faz 2, 27 Tem 2026 ———
     İmleci takip eden parıltı + kenar ışığı + hafif 3B eğilme.
     --mx/--my imleç konumu (yüzde), --hov 0→1 yumuşak giriş/çıkış; hepsini JS yazar.
     Dokunmatikte ve reduced-motion'da JS hiç bağlanmaz → saf kart görünümü kalır. */
  .h-spot { position:relative; isolation:isolate;
    transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateZ(0);
    transition:transform .35s cubic-bezier(.22,.61,.36,1), border-color .3s ease, box-shadow .3s ease; }
  .h-spot.is-live { transition:transform .08s linear, border-color .3s ease, box-shadow .3s ease; }
  .h-spot > * { position:relative; z-index:1; }
  /* Parıltı: kartın kendi yuvarlaklığını miras alır, üstte durur, tıklamayı engellemez */
  .h-spot::before { content:''; position:absolute; inset:0; z-index:0; border-radius:inherit;
    pointer-events:none; opacity:var(--hov,0); transition:opacity .3s ease;
    background:radial-gradient(320px circle at var(--mx,50%) var(--my,50%),
      var(--h-sel) 0%, transparent 62%); }
  /* Kenar ışığı: 1px'lik degrade çerçeve (maskeyle yalnız kenar boyanır) */
  .h-spot::after { content:''; position:absolute; inset:0; z-index:2; border-radius:inherit;
    pointer-events:none; opacity:var(--hov,0); transition:opacity .3s ease; padding:1px;
    background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),
      var(--h-accent) 0%, transparent 70%);
    -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite:xor; mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite:exclude; }
  .h-spot:hover { box-shadow:0 18px 44px var(--h-shadow); }
  @media (prefers-reduced-motion: reduce) {
    .h-spot, .h-spot.is-live { transform:none !important; transition:none !important; }
    .h-spot::before, .h-spot::after { display:none; }
  }
  /* İmleci olmayan cihazlarda (telefon/tablet) efekt tamamen kapalı */
  @media (hover: none) {
    .h-spot::before, .h-spot::after { display:none; }
    .h-spot { transform:none !important; }
  }

  /* ——— YAPIŞKAN ANLATIM AKIŞI (/ozellikler grup bölümleri) ———
     ≥1024px: solda başlık+giriş+ekran görüntüsü sabit kalır, sağda kartlar akar.
     Altında tek sütuna döner (yapışkanlık kapanır) — mobilde davranış eskisiyle aynı. */
  .h-sticky { display:grid; gap:30px; margin-top:26px; }
  .h-sticky-aside { text-align:left; }
  .h-sticky-aside > *:first-child { margin-top:0; }
  @media (min-width:1024px) {
    .h-sticky { grid-template-columns:minmax(0,0.86fr) minmax(0,1.14fr); gap:56px; align-items:start; }
    .h-sticky-aside { position:sticky; top:96px; }
  }

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

  /* ——— AKILLI NAV (SmartNav.jsx) — Faz 3, 27 Tem 2026 ———
     Nav yapışkan; aşağı kaydırınca gizlenir, yukarı kaydırınca döner.
     ⚠ Nav'ın margin/padding'i Chrome.jsx'te SATIR İÇİ stil → burada ezmek için
     !important şart (satır içi stil sınıflardan güçlüdür). Bilinçli. */
  .h-navwrap { position:sticky; top:0; z-index:60; transition:transform .38s cubic-bezier(.22,.61,.36,1); }
  .h-navwrap.is-hidden { transform:translateY(-135%); }
  .h-navwrap.is-stuck > nav { margin-top:10px !important; padding-top:9px !important; padding-bottom:9px !important;
    box-shadow:0 1px 2px var(--h-shadow), 0 14px 40px var(--h-shadow) !important; }
  @media (prefers-reduced-motion: reduce) { .h-navwrap { transition:none; } }

  /* ——— KOMUT PALETİ (CommandPalette.jsx) — Faz 3 ——— */
  .h-cmdbtn { display:flex; align-items:center; gap:8px; height:38px; padding:0 10px 0 11px;
    border:1px solid var(--h-border); border-radius:999px; background:var(--h-card); color:var(--h-muted);
    font-family:'Hanken Grotesk', sans-serif; font-size:14px; cursor:pointer; white-space:nowrap;
    transition:border-color .2s ease, color .2s ease; }
  .h-cmdbtn:hover { border-color:var(--h-accent); color:var(--h-ink); }
  .h-cmdbtn svg { width:16px; height:16px; flex:none; }
  .h-cmdbtn kbd, .h-cmd-alt kbd { font-family:'Hanken Grotesk', sans-serif; font-size:11.5px; line-height:1;
    padding:4px 6px; border:1px solid var(--h-border2); border-radius:6px; color:var(--h-muted);
    background:var(--h-cream); }
  @media (max-width:900px) { .h-cmdbtn .h-cmdbtn-t, .h-cmdbtn kbd { display:none; }
    .h-cmdbtn { width:38px; padding:0; justify-content:center; } }

  .h-cmd-arka { position:fixed; inset:0; z-index:300; background:rgba(0,0,0,.42);
    backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);
    display:flex; align-items:flex-start; justify-content:center; padding:12vh 20px 20px;
    animation:h-fade .16s ease; }
  .h-cmd { width:min(640px,100%); background:var(--h-card); border:1px solid var(--h-border);
    border-radius:18px; box-shadow:0 30px 80px rgba(0,0,0,.4); overflow:hidden;
    display:flex; flex-direction:column; max-height:76vh; }
  .h-cmd-ust { display:flex; align-items:center; gap:11px; padding:15px 16px;
    border-bottom:1px solid var(--h-border); color:var(--h-muted); }
  .h-cmd-ust svg { width:19px; height:19px; flex:none; }
  .h-cmd-ust input { flex:1; border:none; outline:none; background:transparent; color:var(--h-ink);
    font-family:'Hanken Grotesk', sans-serif; font-size:16.5px; min-width:0; }
  .h-cmd-ust input::placeholder { color:var(--h-muted); }
  .h-cmd-ust button { border:1px solid var(--h-border2); background:var(--h-cream); color:var(--h-muted);
    border-radius:7px; padding:4px 8px; font-size:11.5px; cursor:pointer; }
  .h-cmd-liste { overflow-y:auto; padding:8px; }
  .h-cmd-grup { font-size:11.5px; font-weight:700; letter-spacing:.16em; color:var(--h-muted);
    padding:12px 10px 6px; text-transform:uppercase; }
  .h-cmd-sat { display:flex; align-items:baseline; gap:12px; padding:10px 12px; border-radius:11px;
    text-decoration:none; color:var(--h-ink); }
  .h-cmd-sat.on { background:var(--h-tint); color:var(--h-tint-ink); }
  .h-cmd-t { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:15.5px; }
  .h-cmd-h { font-size:12.5px; color:var(--h-muted); flex:none; }
  .h-cmd-bos { padding:34px 16px; text-align:center; color:var(--h-muted); font-size:15px; }
  .h-cmd-alt { display:flex; gap:18px; padding:11px 16px; border-top:1px solid var(--h-border);
    font-size:12.5px; color:var(--h-muted); }
  .h-cmd-alt span { display:inline-flex; align-items:center; gap:5px; }
  @media (max-width:640px) { .h-cmd-arka { padding:8vh 12px 12px; } .h-cmd-h { display:none; } }

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

  /* ANA SAYFA ÜRÜN VİTRİNİ — mesaj, CTA ve gerçek program ekranı ilk görünümde. */
  .h-home-hero { position:relative; max-width:1240px; margin:0 auto; padding:68px 32px 34px;
    display:grid; grid-template-columns:minmax(0,.9fr) minmax(500px,1.1fr); gap:62px; align-items:center; }
  .h-home-hero::before { content:''; position:absolute; width:520px; height:520px; right:1%; top:3%;
    border-radius:50%; pointer-events:none;
    background:radial-gradient(circle, var(--h-accentbg) 0%, transparent 68%); opacity:.55; filter:blur(12px); }
  .h-hero-copy, .h-hero-showcase { position:relative; z-index:1; }
  .h-hero-brandline { display:flex; align-items:center; gap:13px; }
  .h-hero-brandline img { width:52px; height:50px; object-fit:contain; }
  .h-hero-copy h1 { font-family:'Newsreader', serif; font-weight:430;
    font-size:clamp(48px,6.2vw,82px); line-height:.98; letter-spacing:-.04em; margin:24px 0 0; }
  .h-hero-copy p { max-width:590px; margin:24px 0 0; color:var(--h-ink2);
    font-size:17px; line-height:1.75; }
  .h-hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:30px; }
  .h-hero-actions a:first-child { box-shadow:0 12px 34px var(--h-shadow); }
  .h-hero-trust { display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:24px; color:var(--h-muted);
    font-size:13.5px; }
  .h-hero-trust span { display:inline-flex; align-items:center; gap:8px; }
  .h-hero-trust span::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--h-accent); }

  .h-hero-showcase { min-height:470px; display:grid; place-items:center; }
  .h-hero-orbit { position:absolute; inset:2% 5% 0; border:1px solid var(--h-border);
    border-radius:50%; transform:rotate(-12deg); opacity:.85; }
  .h-hero-orbit::before, .h-hero-orbit::after { content:''; position:absolute; border:1px solid var(--h-border);
    border-radius:50%; inset:9%; }
  .h-hero-orbit::after { inset:21%; }
  .h-hero-window { position:relative; width:min(100%,650px); margin:0; padding:34px 10px 10px;
    background:var(--h-card); border:1px solid var(--h-border); border-radius:18px;
    box-shadow:0 28px 80px var(--h-shadow); transform:rotate(1.2deg); overflow:hidden; }
  .h-hero-window > img { display:block; width:100%; aspect-ratio:16/10; object-fit:cover;
    border-radius:10px; background:var(--h-cream); }
  .h-hero-proof { position:absolute; z-index:3; min-width:176px; padding:13px 15px;
    border:1px solid var(--h-border); border-radius:13px; background:var(--h-navbg);
    backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
    box-shadow:0 12px 34px var(--h-shadow); }
  .h-hero-proof span { display:block; color:var(--h-muted); font-size:10px; font-weight:700; letter-spacing:.16em; }
  .h-hero-proof strong { display:block; margin-top:5px; font-family:'Newsreader',serif; font-size:17px; font-weight:500; }
  .h-hero-proof-top { top:6px; right:-12px; }
  .h-hero-proof-bottom { left:-14px; bottom:18px; }
  @media (max-width:1023px) {
    .h-home-hero { grid-template-columns:1fr; gap:32px; padding-top:54px; text-align:center; }
    .h-hero-brandline, .h-hero-actions, .h-hero-trust { justify-content:center; }
    .h-hero-copy p { margin-left:auto; margin-right:auto; }
    .h-hero-showcase { min-height:420px; }
  }
  @media (max-width:640px) {
    .h-home-hero { padding:38px 20px 22px; gap:26px; }
    .h-hero-brandline { flex-direction:column; gap:8px; }
    .h-hero-brandline img { width:46px; height:44px; }
    .h-hero-copy h1 { font-size:clamp(44px,15vw,64px); margin-top:18px; }
    .h-hero-copy p { font-size:16px; line-height:1.68; margin-top:18px; }
    .h-hero-actions { flex-direction:column; align-items:stretch; }
    .h-hero-actions a { text-align:center; }
    .h-hero-trust { gap:9px 14px; }
    .h-hero-showcase { min-height:300px; }
    .h-hero-window { padding:27px 7px 7px; transform:none; border-radius:14px; }
    .h-hero-proof { display:none; }
  }

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

  /* Hero döner slogan (HeroRotator.jsx) — her geçişte yumuşak beliriş */
  .h-rot-line { animation:h-rot-in .5s ease; }
  @keyframes h-rot-in { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:none; } }

  /* ——— Ekran görüntüsü çerçevesi (Shot.jsx) + galeri (Ekranlar.jsx) ——— */
  /* Pencere hissi veren çerçeve: üstte 3 nokta, altında 16:10 görsel */
  .h-shot-frame { position:relative; background:var(--h-card); border:1px solid var(--h-border);
    border-radius:16px; padding:34px 12px 12px; box-shadow:0 1px 2px var(--h-shadow), 0 26px 60px var(--h-shadow);
    overflow:hidden; }
  .h-shot-dots { position:absolute; top:13px; left:16px; display:flex; gap:7px; }
  .h-shot-dots i { width:10px; height:10px; border-radius:50%; background:var(--h-border); display:block; }
  .h-shot-img { display:block; width:100%; aspect-ratio:16/10; object-fit:cover;
    border-radius:8px; background:var(--h-cream); }
  .h-shot-cap { text-align:center; font-size:14px; margin:12px 0 0; }

  /* ——— AKAN ŞERİT (Marquee.jsx) — Faz 4, 27 Tem 2026 ———
     Saf CSS: liste iki kez basılır, şerit %50 kaydırılır → dikişsiz döngü. */
  .h-marq { overflow:hidden; position:relative;
    -webkit-mask-image:linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
    mask-image:linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent); }
  .h-marq-track { display:flex; width:max-content;
    animation:h-marq var(--h-marq-sure,40s) linear infinite; }
  .h-marq:hover .h-marq-track { animation-play-state:paused; }
  .h-marq-grup { display:flex; align-items:center; gap:12px; padding-right:12px; }
  .h-marq-og { border:1px solid var(--h-border); background:var(--h-card); color:var(--h-ink2);
    border-radius:999px; padding:9px 18px; font-size:14px; white-space:nowrap; }
  @keyframes h-marq { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) {
    .h-marq-track { animation:none; }
    .h-marq { overflow-x:auto; -webkit-mask-image:none; mask-image:none; }
  }

  /* Galeri: kayan şerit + oklar + noktalar */
  .h-gal { position:relative; max-width:940px; margin-left:auto; margin-right:auto; }
  /* Faz 4: fare/parmakla sürükleme. touch-action:pan-y → dikey sayfa kaydırması bozulmaz. */
  .h-gal-viewport { overflow:hidden; border-radius:16px; touch-action:pan-y; cursor:grab; }
  .h-gal-viewport.is-drag { cursor:grabbing; }
  .h-gal-viewport img { -webkit-user-drag:none; user-select:none; }
  .h-gal-track { display:flex; transition:transform .5s cubic-bezier(.4,0,.2,1); }
  .h-gal-slide { flex:0 0 100%; min-width:0; margin:0; }
  .h-gal-arrow { position:absolute; top:calc(50% - 18px); transform:translateY(-50%); z-index:2;
    width:44px; height:44px; border-radius:50%; border:1px solid var(--h-border); background:var(--h-card);
    color:var(--h-ink); font-size:26px; line-height:1; cursor:pointer; display:grid; place-items:center;
    box-shadow:0 6px 18px var(--h-shadow); transition:background .2s ease, transform .2s ease; }
  .h-gal-arrow:hover { background:var(--h-accentbg); }
  .h-gal-prev { left:-6px; } .h-gal-next { right:-6px; }
  .h-gal-dots { display:flex; gap:10px; justify-content:center; margin-top:18px; }
  .h-gal-dot { width:9px; height:9px; padding:0; border-radius:50%; border:none; cursor:pointer;
    background:var(--h-border); transition:transform .2s ease, background .2s ease; }
  .h-gal-dot.is-active { background:var(--h-accent); transform:scale(1.35); }
  @media (max-width:900px) { .h-gal-arrow { display:none; } }
  @media (max-width:640px) { .h-shot-frame { padding:28px 8px 8px; } }

  /* Ana sayfa: üç adım + yerel veri güveni */
  .h-step-grid { list-style:none; padding:0; margin:30px 0 0; display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; }
  .h-step-card { min-height:190px; display:flex; flex-direction:column; align-items:flex-start;
    padding:26px; border:1px solid var(--h-border); border-radius:16px; background:var(--h-card); color:var(--h-ink2); }
  .h-step-card strong { margin-top:28px; color:var(--h-ink); font-family:'Newsreader',serif; font-size:22px; font-weight:500; }
  .h-step-card > span:last-child { margin-top:10px; font-size:14.5px; line-height:1.65; }
  .h-step-no { color:var(--h-accent-text); font-size:12px; font-weight:700; letter-spacing:.18em; }
  .h-privacy-panel { display:grid; grid-template-columns:minmax(0,.9fr) minmax(360px,1.1fr);
    gap:56px; align-items:center; padding:46px; border:1px solid var(--h-border);
    border-radius:24px; background:var(--h-cream); }
  .h-privacy-list { display:flex; flex-direction:column; gap:10px; }
  .h-privacy-row { display:flex; align-items:flex-start; gap:13px; padding:15px 16px;
    border:1px solid var(--h-border); border-radius:13px; background:var(--h-card);
    color:var(--h-ink2); font-size:14px; line-height:1.5; }
  .h-privacy-dot { flex:0 0 auto; width:9px; height:9px; margin-top:6px; border-radius:50%;
    background:var(--h-accent); box-shadow:0 0 0 4px var(--h-accentbg); }
  @media (max-width:800px) {
    .h-step-grid { grid-template-columns:1fr; }
    .h-step-card { min-height:0; }
    .h-privacy-panel { grid-template-columns:1fr; gap:28px; padding:30px; }
  }

  /* Özellikler ve fiyat: ilk görünümde karar vermeyi kolaylaştıran iki sütunlu sahneler */
  .h-feature-hero { max-width:1160px; margin:0 auto; padding:64px 32px 0;
    display:grid; grid-template-columns:minmax(0,.82fr) minmax(480px,1.18fr); gap:52px; align-items:center; }
  .h-feature-copy { text-align:left; }
  .h-feature-metrics { display:flex; gap:38px; margin-top:26px; flex-wrap:wrap; }
  .h-route-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:28px; }
  .h-feature-pills { grid-column:1/-1; display:flex; flex-wrap:wrap; gap:10px; margin-top:6px; justify-content:center; }
  .h-price-hero { max-width:1120px; margin:0 auto; padding:62px 32px 8px;
    display:grid; grid-template-columns:minmax(0,.85fr) minmax(420px,1.15fr); gap:62px; align-items:center; }
  .h-price-copy h1 { max-width:580px; font-size:clamp(46px,5.6vw,72px) !important; }
  .h-price-copy p { max-width:560px; }
  .h-price-assurance { display:flex; flex-wrap:wrap; gap:9px; margin-top:26px; }
  .h-price-assurance span { padding:8px 12px; border:1px solid var(--h-border); border-radius:999px;
    background:var(--h-cream); color:var(--h-ink2); font-size:13px; }
  .h-price-card { border-radius:22px; padding:34px 34px 30px; }
  .h-payment-note { margin-top:13px; color:var(--h-muted); font-size:12.5px; }
  .h-license-card { border-radius:22px; padding:34px; display:grid;
    grid-template-columns:minmax(0,.8fr) minmax(300px,1.2fr); column-gap:48px; align-items:start; }
  .h-license-card h2 { grid-column:1; }
  .h-license-card p { grid-column:1; }
  .h-license-card ul { grid-column:2; grid-row:1/3; margin-top:0 !important; }
  @media (max-width:960px) {
    .h-feature-hero, .h-price-hero { grid-template-columns:1fr; gap:34px; text-align:center; }
    .h-feature-copy { text-align:center; }
    .h-feature-copy p, .h-price-copy p, .h-price-copy h1 { margin-left:auto; margin-right:auto; }
    .h-feature-metrics, .h-route-actions, .h-price-assurance { justify-content:center; }
    .h-license-card { grid-template-columns:1fr; }
    .h-license-card h2, .h-license-card p, .h-license-card ul { grid-column:1; grid-row:auto; }
  }
  @media (max-width:640px) {
    .h-feature-hero, .h-price-hero { padding:42px 20px 0; }
    .h-feature-metrics { justify-content:center; }
    .h-route-actions { flex-direction:column; }
    .h-route-actions a { text-align:center; }
    .h-price-card, .h-license-card { padding:26px 22px; }
  }

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

// İlk boya ÖNCESİ tema tespiti (FOUC yok).
// VARSAYILAN = KOYU (Meridyen Rasathanesi) — kullanıcı kararı 27 Tem 2026.
// İşletim sistemi tercihi (prefers-color-scheme) artık DİKKATE ALINMAZ; ilk ziyaret daima koyu.
// Yalnızca ziyaretçi tema düğmesine basmışsa localStorage 'h_tema' değeri ('light'|'dark') kazanır.
// Aynı script 'h-js' sınıfını da ekler → JS'e bağlı efektler (Reveal vb.) ancak o zaman
// devreye girer; JS kapalıysa hiçbir şey gizlenmez.
const THEME_INIT = `(function(){var d=document.documentElement;var t='dark';try{var s=localStorage.getItem('h_tema');if(s==='light'||s==='dark')t=s;}catch(e){}d.dataset.theme=t;d.className=(d.className?d.className+' ':'')+'h-js';})();`;

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
