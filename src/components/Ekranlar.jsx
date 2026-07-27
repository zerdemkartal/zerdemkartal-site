'use client';
// Ana sayfa ekran görüntüsü galerisi — geçişli slider (oklar + noktalar).
// Otomatik döner, üzerine gelince durur; prefers-reduced-motion'da otomatik geçiş kapalı.
// İçerik hermes_site → home.ekranlar'dan gelir; görsel yoksa hiç render etmez.
import { useState, useEffect, useRef } from 'react';
import { T, kickerStyle, h2Style, pStyle, sectionStyle } from './Chrome';

export default function Ekranlar({ data }) {
  const shots = (data && data.shots) || [];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = shots.length;
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  // Faz 4 (27 Tem 2026) — fare/parmakla sürükleme. Konum doğrudan DOM'a yazılır
  // (her kare setState yapmamak için); bırakınca eşiği geçtiyse slayt değişir.
  const surukle = useRef({ aktif: false, x0: 0, dx: 0, en: 0 });

  const go = (k) => setI(((k % n) + n) % n);

  function konumla(k, ekPx = 0) {
    const t = trackRef.current;
    if (t) t.style.transform = ekPx ? `translateX(calc(-${k * 100}% + ${ekPx}px))` : `translateX(-${k * 100}%)`;
  }

  function onDown(e) {
    if (n <= 1) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const vp = e.currentTarget;
    surukle.current = { aktif: true, x0: e.clientX, dx: 0, en: vp.offsetWidth };
    vp.classList.add('is-drag');
    if (trackRef.current) trackRef.current.style.transition = 'none';
    try { vp.setPointerCapture(e.pointerId); } catch { /* eski tarayıcı */ }
  }

  function onMove(e) {
    const d = surukle.current;
    if (!d.aktif) return;
    d.dx = e.clientX - d.x0;
    konumla(i, d.dx);
  }

  function onUp(e) {
    const d = surukle.current;
    if (!d.aktif) return;
    d.aktif = false;
    e.currentTarget.classList.remove('is-drag');
    if (trackRef.current) trackRef.current.style.transition = '';
    const esik = Math.max(46, d.en * 0.15);
    const hedef = d.dx <= -esik ? i + 1 : d.dx >= esik ? i - 1 : i;
    const k = ((hedef % n) + n) % n;
    konumla(k);          // React yeniden render etmese de doğru yerde kalsın
    if (k !== i) setI(k);
  }

  function onKey(e) {
    if (n <= 1) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
  }

  useEffect(() => {
    if (n <= 1 || paused) return;
    const rm = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm) return;
    const id = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(id);
  }, [n, paused]);

  if (n === 0) return null;

  return (
    <section style={sectionStyle}>
      <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
        {data.kicker ? <div style={kickerStyle}>{data.kicker}</div> : null}
        {data.title ? <h2 style={h2Style}>{data.title}</h2> : null}
        {data.p ? <p style={{ ...pStyle, marginLeft: 'auto', marginRight: 'auto' }}>{data.p}</p> : null}
      </div>

      <div
        className="h-gal"
        ref={wrapRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ marginTop: 30 }}
        role="group"
        aria-roledescription="galeri"
        aria-label={data.title || 'Ekran görüntüleri'}
        tabIndex={n > 1 ? 0 : undefined}
        onKeyDown={onKey}
      >
        <div
          className="h-gal-viewport"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="h-gal-track" ref={trackRef} style={{ transform: `translateX(-${i * 100}%)` }}>
            {shots.map((s, k) => (
              <figure key={k} className="h-gal-slide" aria-hidden={k !== i}>
                <div className="h-shot-frame">
                  <span className="h-shot-dots" aria-hidden="true"><i /><i /><i /></span>
                  <img src={s.src} alt={s.alt || s.cap || `Hermes ekran görüntüsü ${k + 1}`} className="h-shot-img" draggable={false} loading={k === 0 ? 'eager' : 'lazy'} />
                </div>
                {s.cap ? <figcaption className="h-shot-cap" style={{ color: T.muted }}>{s.cap}</figcaption> : null}
              </figure>
            ))}
          </div>
        </div>

        {n > 1 && (
          <>
            <button type="button" className="h-gal-arrow h-gal-prev" aria-label="Önceki" onClick={() => go(i - 1)}>‹</button>
            <button type="button" className="h-gal-arrow h-gal-next" aria-label="Sonraki" onClick={() => go(i + 1)}>›</button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="h-gal-dots" role="tablist" aria-label="Görsel seç">
          {shots.map((s, k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-label={`${k + 1}. görsel${s.cap ? ': ' + s.cap : ''}`}
              className={'h-gal-dot' + (k === i ? ' is-active' : '')}
              onClick={() => go(k)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
