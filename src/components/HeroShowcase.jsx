'use client';

// Ana sayfa ilk görünümündeki gerçek ürün vitrini.
// Birden çok Hermes ekranı arasında otomatik/elle geçer; üzerine gelince ve
// klavye odağı içindeyken durur. İlk kadran karesi kaynak görsel içindeki
// boş alanı azaltmak için yalnız bu vitrinde yakın gösterilir.
import { useEffect, useRef, useState } from 'react';

export default function HeroShowcase({ shots = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointer = useRef({ active: false, x: 0 });
  const count = shots.length;

  const go = (next) => {
    if (!count) return;
    setIndex(((next % count) + count) % count);
  };

  useEffect(() => {
    if (count <= 1 || paused) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;

  const active = shots[index] || shots[0];

  return (
    <div
      className="h-hero-showcase"
      aria-roledescription="ürün ekranı galerisi"
      aria-label="Hermes programından gerçek ekranlar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          go(index + 1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          go(index - 1);
        }
      }}
    >
      <div className="h-hero-orbit" aria-hidden="true" />
      <div className="h-hero-slider">
        <div className="h-hero-window">
          <span className="h-shot-dots" aria-hidden="true"><i /><i /><i /></span>
          <div
            className="h-hero-viewport"
            onPointerDown={(event) => {
              if (event.pointerType === 'mouse' && event.button !== 0) return;
              pointer.current = { active: true, x: event.clientX };
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }}
            onPointerUp={(event) => {
              if (!pointer.current.active) return;
              const delta = event.clientX - pointer.current.x;
              pointer.current.active = false;
              if (Math.abs(delta) < 44) return;
              go(delta < 0 ? index + 1 : index - 1);
            }}
            onPointerCancel={() => {
              pointer.current.active = false;
            }}
          >
            <div className="h-hero-track" style={{ transform: `translateX(-${index * 100}%)` }}>
              {shots.map((shot, shotIndex) => (
                <figure
                  className={`h-hero-slide${shot.heroZoom ? ' is-focus' : ''}`}
                  key={`${shot.src}-${shotIndex}`}
                  aria-hidden={shotIndex !== index}
                >
                  <img
                    src={shot.src}
                    alt={shot.alt || shot.cap || `Hermes ekranı ${shotIndex + 1}`}
                    draggable={false}
                    loading={shotIndex === 0 ? 'eager' : 'lazy'}
                    fetchPriority={shotIndex === 0 ? 'high' : 'auto'}
                  />
                </figure>
              ))}
            </div>
          </div>
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              className="h-hero-arrow h-hero-prev"
              aria-label="Önceki program ekranı"
              onClick={() => go(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="h-hero-arrow h-hero-next"
              aria-label="Sonraki program ekranı"
              onClick={() => go(index + 1)}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      <div className="h-hero-proof h-hero-proof-top" aria-live="polite">
        <span>GERÇEK PROGRAM EKRANI</span>
        <strong>{active.cap || `Hermes çalışma alanı ${index + 1}`}</strong>
      </div>
      <div className="h-hero-proof h-hero-proof-bottom">
        <span>CANLI ÇALIŞMA ALANLARI</span>
        <strong>{String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</strong>
      </div>

      {count > 1 ? (
        <div className="h-hero-dots" aria-label="Program ekranı seç">
          {shots.map((shot, shotIndex) => (
            <button
              key={`${shot.src}-dot-${shotIndex}`}
              type="button"
              aria-label={`${shotIndex + 1}. ekran${shot.cap ? `: ${shot.cap}` : ''}`}
              aria-current={shotIndex === index ? 'true' : undefined}
              className={shotIndex === index ? 'is-active' : ''}
              onClick={() => go(shotIndex)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
