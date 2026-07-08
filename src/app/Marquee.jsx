'use client';
// Kayan şerit (marquee) — koyu/italik "ribbon" ya da açık/uppercase "tags" varyantı.
// Piksel referansı: AnaSayfaView.dc.html dark/light marquee.

export default function Marquee({ text = '', rotate = 0, base = 32, variant = 'ribbon' }) {
  const isRibbon = variant === 'ribbon';
  const span = isRibbon
    ? { fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: 26, color: '#2B1D12', letterSpacing: '0.01em' }
    : { fontSize: 15, letterSpacing: '0.18em', color: '#B3AEA1', textTransform: 'uppercase' };
  return (
    <div aria-hidden="true" style={{ position: 'relative', transform: `rotate(${rotate}deg)`, margin: isRibbon ? '10px -40px 24px' : '24px -40px', borderTop: '1px solid #E8E3D6', borderBottom: '1px solid #E8E3D6', padding: isRibbon ? '15px 0' : '14px 0', overflow: 'hidden' }}>
      <style>{`@keyframes zkMarq{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: 'inline-flex', gap: isRibbon ? 56 : 48, whiteSpace: 'nowrap', animation: `zkMarq ${base}s linear infinite`, willChange: 'transform' }}>
        <span style={span}>{text}</span>
        <span style={span}>{text}</span>
      </div>
    </div>
  );
}
