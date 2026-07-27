'use client';
// SAYAÇ — Faz 4 (27 Tem 2026). Bağımlılık YOK.
//
// Görünüre girince 0'dan hedefe sayar. SSR'da doğrudan HEDEF DEĞER basılır
// (hydration uyuşmazlığı yok, JS kapalıysa/bot okurken doğru sayı görünür);
// animasyon yalnız tarayıcıda, görünüre girince bir kez oynar.
//
// ÖNEMLİ (içerik dürüstlüğü): bu bileşene yalnız GERÇEK, veriden türeyen sayılar
// verilir — "5000+ kullanıcı" gibi uydurma rakamlar site genelinde yasak
// (sahte puan/yorumlar H1'de bilinçli olarak silinmişti).
import { useEffect, useRef, useState } from 'react';

export default function Counter({ to = 0, sure = 1000, once = true, style, ...rest }) {
  const hedef = Number(to) || 0;
  const [v, setV] = useState(hedef); // SSR = son değer
  const ref = useRef(null);
  const oynadi = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let kare = 0;
    const oynat = () => {
      if (once && oynadi.current) return;
      oynadi.current = true;
      const t0 = performance.now();
      const adim = (t) => {
        const p = Math.min(1, (t - t0) / sure);
        const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setV(Math.round(hedef * e));
        if (p < 1) kare = requestAnimationFrame(adim);
      };
      setV(0);
      kare = requestAnimationFrame(adim);
    };

    const io = new IntersectionObserver((girisler) => {
      for (const g of girisler) if (g.isIntersecting) { oynat(); io.unobserve(g.target); }
    }, { threshold: 0.4 });
    io.observe(el);

    return () => { if (kare) cancelAnimationFrame(kare); io.disconnect(); };
  }, [hedef, sure, once]);

  return <span ref={ref} style={style} {...rest}>{v}</span>;
}
