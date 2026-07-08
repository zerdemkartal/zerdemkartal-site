'use client';
// Ana sayfa hero — carousel (6.5sn otomatik, hover'da durur) + SVG eğri akan yazı (rAF).
// Piksel referansı: AnaSayfaView.dc.html hero. SSR sayfası bunu istemci tarafında canlandırır.
import { useState, useEffect, useRef } from 'react';

const ACCENT = '#DCE7DB';
const INK = '#2B1D12', INK2 = '#41352A', MUTED = '#6B675E';
const SERIF = "'Newsreader', serif";
const FLOW_PATH = 'M -60 -20 C 80 10 190 70 205 175 C 215 245 175 330 95 335 C 20 339 -10 245 60 180 C 120 127 240 135 330 190 C 480 280 640 430 890 470 C 1140 505 1360 460 1560 480 C 1710 494 1830 486 1960 510';

export default function HomeHero({ slides = [], flow = {} }) {
  const [active, setActive] = useState(0);
  const paused = useRef(false);
  const textRef = useRef(null);
  const n = slides.length || 1;

  // otomatik geçiş
  useEffect(() => {
    const id = setInterval(() => { if (!paused.current) setActive((a) => (a + 1) % n); }, 6500);
    return () => clearInterval(id);
  }, [n]);

  // eğri boyunca akan yazı
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const seg = (flow.curve || '').trim();
    el.textContent = seg ? (seg + ' ✳ ').repeat(6) : '';
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf, unit = 0, measured = false;
    const t0 = performance.now();
    const tick = (now) => {
      if (!measured) {
        let L = 0;
        try { L = el.getComputedTextLength(); } catch (e) {}
        if (L > 0) { unit = L / 6; measured = true; }
      }
      if (unit > 0 && !reduce) {
        el.setAttribute('startOffset', (((now - t0) / 1000 * 42) % unit) - unit);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [flow.curve]);

  const btn = { display: 'inline-flex', alignItems: 'center', gap: 11, background: ACCENT, border: '1px solid rgba(43,29,18,0.35)', borderRadius: 15, padding: '17px 30px', fontSize: 17, fontWeight: 600, color: INK, textDecoration: 'none', boxShadow: '0 1px 0 rgba(43,29,18,0.08), 0 12px 28px rgba(142,124,195,0.18)' };

  return (
    <section style={{ position: 'relative', overflow: 'hidden', paddingBottom: 20 }}>
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '92px 32px 0' }}>
        <div onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }} style={{ overflow: 'hidden', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)', transform: `translateX(-${active * 100}%)` }}>
            {slides.map((s, i) => (
              <div key={i} style={{ flex: '0 0 100%', minWidth: 0, boxSizing: 'border-box' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.22em', color: MUTED, display: 'inline-block' }}>{s.kicker}</div>
                <h1 style={{ fontFamily: SERIF, fontWeight: 420, fontSize: 'clamp(48px, 7vw, 108px)', lineHeight: 1.03, letterSpacing: '-0.025em', margin: '18px 0 0', color: INK, textWrap: 'balance' }}>{s.titleGray}{s.titleInk}</h1>
                <p style={{ fontSize: 20, lineHeight: 1.6, color: INK2, maxWidth: 540, margin: '28px auto 0' }}>{s.paragraph}</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 38 }}>
                  <a href={s.href} style={btn}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 L14.4 9.6 L22 12 L14.4 14.4 L12 22 L9.6 14.4 L2 12 L9.6 9.6 Z" fill="#2B1D12" /></svg>
                    <span>{s.btn}</span>
                  </a>
                  <span style={{ fontSize: 14, color: MUTED }}>{s.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* noktalar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 40 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} aria-label={`Slayt ${i + 1}`}
              style={{ width: i === active ? 30 : 9, height: 9, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 100, background: i === active ? INK : '#D8D2C4', transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), background 0.45s ease' }} />
          ))}
        </div>
      </div>

      {/* eğri boyunca akan dekoratif yazı */}
      <svg aria-hidden="true" style={{ position: 'absolute', left: -70, bottom: -10, width: 1900, height: 460, pointerEvents: 'none', zIndex: 1 }} viewBox="0 0 1900 640" fill="none">
        <path id="zk-flow-path" d={FLOW_PATH} stroke="none" />
        <text style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 19, letterSpacing: '0.04em', fill: '#B3AEA1' }}>
          <textPath ref={textRef} href="#zk-flow-path" startOffset="0" />
        </text>
      </svg>
    </section>
  );
}
