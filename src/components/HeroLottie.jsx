// Hero arka planı — DÖNEN ZODYAK LOTTIE ANİMASYONU KALDIRILDI (kullanıcı isteği, 23 Tem 2026).
// Geriye yalnız soluk merkez Hermes amblemi + metin okunurluğu için radial veil kaldı.
// (lottie-web CDN yüklemesi ve çark verisi tamamen çıkarıldı; başka hiçbir yer window.lottie kullanmıyor.)
// Metin ayrı SSR (page.jsx .hero-inner) → SEO etkilenmez; bu katman yalnız görsel (aria-hidden).
export default function HeroLottie() {
  return (
    <div className="hero-lottie" aria-hidden="true">
      <img src="/assets/hermes-mark.svg" alt="" className="hero-emblem" />
      <div className="hero-veil" />
    </div>
  );
}
