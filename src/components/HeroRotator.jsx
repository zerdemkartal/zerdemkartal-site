'use client';
// Hero'da dönen ikna edici slogan satırı — 3 mesaj + 3 nokta, otomatik değişir.
// prefers-reduced-motion'da otomatik geçiş durur; noktalarla elle gezilir.
import { useState, useEffect } from 'react';
import { T } from './Chrome';

export default function HeroRotator({ lines = [] }) {
  const [i, setI] = useState(0);
  const n = lines.length;

  useEffect(() => {
    if (n <= 1) return;
    const rm = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm) return;
    const id = setInterval(() => setI((p) => (p + 1) % n), 4200);
    return () => clearInterval(id);
  }, [n]);

  if (n === 0) return null;

  return (
    <div style={{ marginTop: 26, textAlign: 'center' }} aria-live="polite">
      <p
        key={i}
        className="h-rot-line"
        style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 'clamp(18px, 2.2vw, 23px)',
          lineHeight: 1.5, color: T.ink2, maxWidth: 660, margin: '0 auto', minHeight: '3em',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {lines[i]}
      </p>
      {n > 1 && (
        <div className="h-gal-dots" role="tablist" aria-label="Slogan seç">
          {lines.map((l, k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-label={`${k + 1}. mesaj`}
              className={'h-gal-dot' + (k === i ? ' is-active' : '')}
              onClick={() => setI(k)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
