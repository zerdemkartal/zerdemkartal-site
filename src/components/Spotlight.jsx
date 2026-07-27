'use client';
// KART ETKİLEŞİMİ — Faz 2 (27 Tem 2026). Bağımlılık YOK: pointer olayları + CSS değişkenleri.
//
// Ne yapar: imleç kartın üstündeyken (1) imleci takip eden yumuşak parıltı,
// (2) imlecin olduğu yerde parlayan 1px kenar ışığı, (3) çok hafif 3B eğilme.
// Efektin tamamı CSS'te (.h-spot, layout.jsx inline THEME_CSS); burada yalnızca
// --mx/--my/--rx/--ry/--hov değişkenleri yazılır.
//
// Sınırlar (bilinçli):
//  • İmleci olmayan cihazda (hover:none) ve reduced-motion'da olay dinleyicisi HİÇ bağlanmaz.
//  • Sayfa kaydırırken hesap yapılmaz; yalnız pointermove sırasında, rAF ile tek kare.
//  • Kart içeriği z-index:1 katmanında → parıltı metnin arkasında, tıklama engellenmez.
//
// Kullanım: <Spotlight style={cardStyle} tilt={5}>…</Spotlight>
//           <Spotlight as="a" href="…" style={cardStyle}>…</Spotlight>
import { useEffect, useRef } from 'react';

export default function Spotlight({ as: Tag = 'div', tilt = 4.5, className = '', style, children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !window.matchMedia) return;
    // İnce imleç yoksa (dokunmatik) ya da hareket azaltılmışsa: hiç bağlanma.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let kare = 0;
    let sonX = 0, sonY = 0;

    const ciz = () => {
      kare = 0;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = (sonX - r.left) / r.width;   // 0→1
      const y = (sonY - r.top) / r.height;   // 0→1
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      if (tilt) {
        // Merkezden uzaklık → eğim. Ters işaret: imlece doğru "bakar".
        el.style.setProperty('--ry', `${((x - 0.5) * 2 * tilt).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * 2 * tilt).toFixed(2)}deg`);
      }
    };

    const onMove = (e) => {
      sonX = e.clientX; sonY = e.clientY;
      if (!kare) kare = requestAnimationFrame(ciz);
    };
    const onEnter = () => { el.classList.add('is-live'); el.style.setProperty('--hov', '1'); };
    const onLeave = () => {
      el.classList.remove('is-live');          // yumuşak geri dönüş için uzun geçiş
      el.style.setProperty('--hov', '0');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      if (kare) { cancelAnimationFrame(kare); kare = 0; }
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    // Klavyeyle gezinenler de kenar ışığını görsün (parıltı merkezde durur)
    el.addEventListener('focusin', onEnter);
    el.addEventListener('focusout', onLeave);

    return () => {
      if (kare) cancelAnimationFrame(kare);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('focusin', onEnter);
      el.removeEventListener('focusout', onLeave);
    };
  }, [tilt]);

  return (
    <Tag ref={ref} className={`h-spot ${className}`.trim()} style={style} {...rest}>
      {children}
    </Tag>
  );
}
