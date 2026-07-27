'use client';
// KAYDIRMADA BELİRİŞ — Faz 1 (27 Tem 2026). Bağımlılık YOK: saf IntersectionObserver.
//
// Sözleşme:
//  • CSS `layout.jsx` içindeki inline THEME_CSS bloğunda (.h-reveal / .is-in / .h-r-fill).
//    Ayrı bir CSS dosyası AÇILMAZ — projede globals.css denemesi tüm temayı düşürmüştü.
//  • Gizleme yalnız <html class="h-js"> varken geçerli → JS kapalıysa veya arama motoru
//    ham HTML okurken içerik görünür kalır. Metin SSR'da zaten basılıdır; bu katman
//    salt görsel. SEO/GEO etkilenmez.
//  • `prefers-reduced-motion: reduce` → CSS tarafında animasyon tamamen iptal.
//
// Kullanım:
//   <Reveal>…</Reveal>                       tek blok
//   <Reveal delay={i * 70}>…</Reveal>        ızgarada sıralı beliriş (stagger)
//   <Reveal className="h-r-fill">…</Reveal>  ızgara hücresinde kart yüksekliğini eşitler
//   <Reveal as="li">…</Reveal>               sarmalayıcı etiketi değiştir (ol/ul içinde şart)
import { useEffect, useRef } from 'react';

export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Tarayıcı desteklemiyorsa gizli bırakma — hemen aç.
    if (typeof IntersectionObserver === 'undefined') { el.classList.add('is-in'); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target); // tek seferlik: geri kaydırınca yeniden oynamaz
      }
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    io.observe(el);

    // EMNİYET AĞI: gözlemci herhangi bir sebeple tetiklenmezse (eklenti, eski tarayıcı,
    // sekme arka planda açıldı, kapsayıcı ölçüsü 0 hesaplandı…) içerik gizli KALMASIN.
    // 1.6 sn sonra ne olursa olsun açılır. Efekt bir lüks; metnin görünmesi şart.
    const bekci = setTimeout(() => { if (el) el.classList.add('is-in'); }, 1600);

    return () => { clearTimeout(bekci); io.disconnect(); };
  }, []);

  const st = delay ? { ...(style || {}), '--h-rd': `${delay}ms` } : style;
  return (
    <Tag ref={ref} className={`h-reveal ${className}`.trim()} style={st} {...rest}>
      {children}
    </Tag>
  );
}
