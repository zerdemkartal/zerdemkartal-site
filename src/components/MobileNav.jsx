'use client';
// Mobil navigasyon — hamburger + tam ekran çekmece (kalite raporu P0: telefonda nav taşması).
// Masaüstünde CSS ile gizli (.h-burger), ≤900px'te görünür. Esc / bağlantı / kapat ile kapanır.
import { useEffect, useState } from 'react';

const LINKS = [
  ['/ozellikler', 'Özellikler'],
  ['/fiyat', 'Fiyat'],
  ['/indir', 'İndir'],
  ['/blog', 'Blog'],
  ['/sss', 'SSS']
];

export default function MobileNav({ active }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button className="h-burger" aria-label="Menüyü aç" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {open && (
        <div className="h-drawer" role="dialog" aria-modal="true" aria-label="Menü">
          <div className="h-drawer-top">
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/assets/hermes-mark.svg" alt="" style={{ width: 34, height: 32 }} />
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 600, color: 'var(--h-ink)' }}>Hermes</span>
            </span>
            <button className="h-burger" aria-label="Menüyü kapat" onClick={() => setOpen(false)} style={{ display: 'grid' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav aria-label="Mobil gezinme">
            {LINKS.map(([href, label]) => (
              <a key={href} href={href} className={href === active ? 'on' : ''} onClick={() => setOpen(false)}>{label}</a>
            ))}
            <a href="/uye" data-cta onClick={() => setOpen(false)}>Üye girişi</a>
          </nav>
        </div>
      )}
    </>
  );
}
