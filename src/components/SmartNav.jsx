'use client';
// AKILLI NAV SARMALAYICI — Faz 3 (27 Tem 2026). Bağımlılık YOK.
//
// Nav'ı yapışkan yapar ve kaydırma yönüne tepki verdirir:
//   • sayfa başındayken: eskisi gibi, üstte serbest duran cam çubuk
//   • aşağı kaydırırken (>240px): yukarı kayıp gizlenir → okuma alanı açılır
//   • yukarı kaydırırken: hemen geri gelir (kullanıcı gezinmek istiyor demektir)
//
// Nav'ın MARKUP'I DEĞİŞMEDİ; bu bileşen yalnız dıştan sarar ve sınıf ekler
// (.h-navwrap + is-stuck/is-hidden). Çocuklar sunucuda render edilir, buraya
// prop olarak gelir → SSR ve SEO etkilenmez.
//
// Reduced-motion: gizleme davranışı kapanır, nav yalnız yapışkan kalır.
import { useEffect, useRef } from 'react';

export default function SmartNav({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const azHareket = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let sonY = window.scrollY || 0;
    let kare = 0;

    const olc = () => {
      kare = 0;
      const y = window.scrollY || 0;
      el.classList.toggle('is-stuck', y > 12);
      if (!azHareket) {
        const asagi = y > sonY;
        // 6px'lik ölü bölge: titrek kaydırmalarda nav zıplamasın
        if (Math.abs(y - sonY) > 6) el.classList.toggle('is-hidden', asagi && y > 240);
      }
      sonY = y;
    };

    const onScroll = () => { if (!kare) kare = requestAnimationFrame(olc); };
    window.addEventListener('scroll', onScroll, { passive: true });
    olc();
    return () => { if (kare) cancelAnimationFrame(kare); window.removeEventListener('scroll', onScroll); };
  }, []);

  return <div className="h-navwrap" ref={ref}>{children}</div>;
}
