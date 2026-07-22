'use client';
// Açık/koyu mod anahtarı — koyu = "Meridyen Rasathanesi" (Hermes tema ailesi).
// Tercih localStorage 'h_tema'; ilk boya öncesi okuma layout.jsx'teki inline script'te.
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(null); // null = henüz mount olmadı (SSR nötr)

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('h_tema', next); } catch {}
    setTheme(next);
  }

  return (
    <button onClick={toggle} aria-label={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç (Meridyen Rasathanesi)'}
      title={theme === 'dark' ? 'Açık mod' : 'Meridyen Rasathanesi (koyu)'}
      style={{ width: 38, height: 38, borderRadius: 999, border: '1px solid var(--h-border)', background: 'var(--h-card)', color: 'var(--h-ink)', cursor: 'pointer', fontSize: 17, lineHeight: 1, display: 'grid', placeItems: 'center', padding: 0 }}>
      <span aria-hidden="true">{theme === 'dark' ? '☀︎' : '☾︎'}</span>
    </button>
  );
}
