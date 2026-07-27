// AKAN ŞERİT — Faz 4 (27 Tem 2026). JS YOK: saf CSS animasyonu (.h-marq, layout.jsx).
//
// Sunucu bileşeni — 'use client' gerekmez, ek JS paketi büyümez.
// Kesintisiz akış için liste iki kez basılır; İKİNCİ KOPYA aria-hidden'dır →
// ekran okuyucu ve arama motoru içeriği iki kez görmez.
// Üzerine gelince durur; prefers-reduced-motion'da animasyon kapanır, şerit
// yatay kaydırılabilir sıradan bir listeye döner.
//
// Kullanım: <Marquee items={['…','…']} sure={42} />
export default function Marquee({ items = [], sure = 40, style }) {
  const list = (items || []).filter(Boolean);
  if (list.length === 0) return null;

  const grup = (gizli) => (
    <div className="h-marq-grup" aria-hidden={gizli ? 'true' : undefined}>
      {list.map((t, i) => <span key={i} className="h-marq-og">{t}</span>)}
    </div>
  );

  return (
    <div className="h-marq" style={{ ...style, '--h-marq-sure': `${sure}s` }}>
      <div className="h-marq-track">
        {grup(false)}
        {grup(true)}
      </div>
    </div>
  );
}
