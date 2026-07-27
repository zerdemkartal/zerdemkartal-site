// Çerçeveli/gölgeli tek ekran görüntüsü — pencere hissi veren kart.
// Sunucu bileşeni (etkileşim yok). Görsel 16:10; iki temada da düzgün.
import { T } from './Chrome';

export default function Shot({ src, alt, cap, style, priority = false }) {
  if (!src) return null;
  return (
    <figure className="h-shot" style={{ margin: 0, ...style }}>
      <div className="h-shot-frame">
        <span className="h-shot-dots" aria-hidden="true"><i /><i /><i /></span>
        <img
          src={src}
          alt={alt || cap || 'Hermes ekran görüntüsü'}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="h-shot-img"
        />
      </div>
      {cap ? <figcaption className="h-shot-cap" style={{ color: T.muted }}>{cap}</figcaption> : null}
    </figure>
  );
}
