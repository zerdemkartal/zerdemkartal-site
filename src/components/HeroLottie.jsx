'use client';
// Hero arka plan animasyonu — gerçek Lottie (lottie-web, cdnjs'ten runtime yüklenir → npm install gerekmez).
// Dönen zodyak çarkı (12 burç glifi) + halkalar + yörüngedeki gezegenler + nabız çekirdek + neon parıltılar.
// İki tema: palet data-theme'e göre kurulur, tema değişince yeniden çizilir. prefers-reduced-motion'da durur.
// Metin ayrı SSR (page.jsx .hero-inner) → SEO etkilenmez; bu katman yalnız görsel (aria-hidden).
import { useEffect, useRef } from 'react';

const T = 900; // toplam kare — daha büyük = daha yavaş hareket (gezegenler sakinleşti)

const hex = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, 1]; };

function palette(theme) {
  return theme === 'dark'
    ? { rose: hex('#C792A8'), rose2: hex('#DBACBE'), gold: hex('#BEA36B'), line: hex('#586274'), spark: hex('#F0DCE6') }
    : { rose: hex('#8F4D67'), rose2: hex('#B0698A'), gold: hex('#98783B'), line: hex('#AEBBBD'), spark: hex('#C98BA6') };
}

const tr = () => ({ ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } });
const rot = (from, to) => ({ a: 1, k: [{ t: 0, s: [from], o: { x: [0.5], y: [0.5] }, i: { x: [0.5], y: [0.5] } }, { t: T, s: [to] }] });
const ease = { x: [0.42], y: [0] }, easeI = { x: [0.58], y: [1] };

function layer(ind, nm, shapes, r, ks) {
  const base = { o: { a: 0, k: 100 }, r: r || { a: 0, k: 0 }, p: { a: 0, k: [300, 300, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } };
  if (ks) Object.assign(base, ks);
  return { ddd: 0, ind, ty: 4, nm, sr: 1, ks: base, ao: 0, shapes, ip: 0, op: T, st: 0, bm: 0 };
}
function ring(D, color, w, dash) {
  const st = { ty: 'st', c: { a: 0, k: color }, o: { a: 0, k: 100 }, w: { a: 0, k: w }, lc: 2, lj: 1, ml: 4 };
  if (dash) st.d = [{ n: 'd', nm: 'd', v: { a: 0, k: dash[0] } }, { n: 'g', nm: 'g', v: { a: 0, k: dash[1] } }, { n: 'o', nm: 'o', v: { a: 0, k: 0 } }];
  return { ty: 'gr', it: [{ ty: 'el', d: 1, s: { a: 0, k: [D, D] }, p: { a: 0, k: [0, 0] } }, st, tr()] };
}
function dot(R, D, color) {
  return { ty: 'gr', it: [{ ty: 'el', d: 1, s: { a: 0, k: [D, D] }, p: { a: 0, k: [R, 0] } }, { ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 }, tr()] };
}
function ticks(R, color) {
  const it = [];
  for (let k = 0; k < 12; k++) {
    const big = k % 3 === 0;
    it.push({ ty: 'gr', it: [
      { ty: 'rc', d: 1, s: { a: 0, k: [big ? 3 : 2, big ? 22 : 12] }, p: { a: 0, k: [0, -R] }, r: { a: 0, k: 0 } },
      { ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: big ? 100 : 65 }, r: 1 },
      { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: k * 30 }, o: { a: 0, k: 100 } }
    ] });
  }
  return it;
}
function sparkle(ind, x, y, D, color, phase) {
  return { ddd: 0, ind, ty: 4, nm: 'spark', sr: 1, ao: 0, ip: 0, op: T, st: 0, bm: 0,
    ks: { r: { a: 0, k: 0 }, p: { a: 0, k: [x, y, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
      o: { a: 1, k: [
        { t: phase, s: [0], o: ease, i: easeI }, { t: phase + 14, s: [100], o: ease, i: easeI },
        { t: phase + 44, s: [0], o: ease, i: easeI }, { t: T, s: [0] }
      ] } },
    shapes: [{ ty: 'gr', it: [{ ty: 'el', d: 1, s: { a: 0, k: [D, D] }, p: { a: 0, k: [0, 0] } }, { ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 }, tr()] }] };
}

function buildData(theme) {
  const c = palette(theme);
  // Merkez artık Hermes glifi (ayrı SVG); Lottie yalnız halkalar + gezegenler + parıltı çizer.
  return { v: '5.9.0', fr: 60, ip: 0, op: T, w: 600, h: 600, nm: 'hermes-hero', ddd: 0, assets: [], layers: [
    sparkle(1, 300, 74, 6, c.spark, 0),
    sparkle(2, 496, 214, 5, c.gold, 300),
    sparkle(3, 112, 322, 6, c.spark, 620),
    sparkle(4, 432, 462, 5, c.rose2, 150),
    sparkle(5, 172, 150, 4, c.gold, 760),
    layer(6, 'p_gold', [dot(214, 9, c.gold)], rot(0, -720)),
    layer(7, 'p_rose', [dot(158, 15, c.rose)], rot(0, 360)),
    layer(8, 'p_rose2', [dot(98, 20, c.rose2)], rot(0, -360)),
    layer(9, 'mid', [ring(330, c.rose, 1.5, [6, 20])], rot(0, 720)),
    layer(10, 'tick', ticks(240, c.rose), rot(0, 360)),
    layer(11, 'outer', [ring(470, c.line, 1.5, [10, 26])], rot(0, -360)),
    layer(12, 'inner', [ring(196, c.line, 1, null)], rot(0, 360))
  ] };
}

export default function HeroLottie() {
  const box = useRef(null);

  useEffect(() => {
    let anim = null, destroyed = false;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const theme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

    function draw() {
      if (destroyed || !box.current || !window.lottie) return;
      if (anim) { anim.destroy(); anim = null; }
      anim = window.lottie.loadAnimation({ container: box.current, renderer: 'svg', loop: true, autoplay: !reduce, animationData: buildData(theme()) });
      if (reduce) anim.goToAndStop(0, true);
    }
    function ensure() {
      if (window.lottie) return draw();
      let s = document.getElementById('lottie-cdn');
      if (!s) { s = document.createElement('script'); s.id = 'lottie-cdn'; s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'; document.head.appendChild(s); }
      s.addEventListener('load', draw, { once: true });
      const iv = setInterval(() => { if (window.lottie) { clearInterval(iv); draw(); } }, 90);
      setTimeout(() => clearInterval(iv), 6000);
    }
    ensure();

    const obs = new MutationObserver(() => draw());
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { destroyed = true; obs.disconnect(); if (anim) anim.destroy(); };
  }, []);

  return (
    <div className="hero-lottie" aria-hidden="true">
      <div ref={box} className="hero-lottie-svg" />
      <img src="/assets/hermes-mark.svg" alt="" className="hero-emblem" />
      <div className="hero-veil" />
    </div>
  );
}
