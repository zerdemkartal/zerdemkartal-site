'use client';
// Blog kütüphanesi — ORTALI başlık + "Kütüphane ağacı" tam ekran menü + ÖNE ÇIKANLAR carousel (görselli, otomatik dönen,
// noktalı) + görsel/illüstrasyon merkezli editöryal kart ızgarası + arama. Görseller şimdilik glifli tonlu placeholder;
// kapak eklenince yerini alır. Veri sunucudan (blog/page.jsx): nodes + featured (color/snippet dahil).
import { useState, useEffect, useRef } from 'react';

const INK = 'var(--h-ink)', INK2 = 'var(--h-ink2)', MUTED = 'var(--h-muted)', BORDER = 'var(--h-border)', PURPLE = 'var(--h-accent)', CREAM = 'var(--h-cream)', PTINT = 'var(--h-tint)', PINK_INK = 'var(--h-tint-ink)';
const SERIF = "'Newsreader', serif";

function pagesUnder(node) {
  let out = [];
  (node.children || []).forEach((c) => { if (c.type === 'page') out.push(c); else out = out.concat(pagesUnder(c)); });
  return out;
}
function findNode(nodes, id) {
  for (const n of nodes) { if (n.id === id) return n; if (n.children) { const f = findNode(n.children, id); if (f) return f; } }
  return null;
}

function HeroCarousel({ slides }) {
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const n = slides.length;
  useEffect(() => {
    if (n <= 1) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => { if (!paused.current) setIdx((i) => (i + 1) % n); }, 4200);
    return () => clearInterval(t);
  }, [n]);
  const s = slides[idx] || slides[0];
  if (!s) return null;
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A8F80', marginBottom: 12, textAlign: 'center' }}>Öne çıkanlar</div>
      <a href={`/blog/yazi/${s.id}`} className="zk-edart" onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }} style={{ display: 'block', textDecoration: 'none', color: INK }}>
        <div key={idx} className="zk-herofade">
          <div style={{ height: 'clamp(300px, 34vw, 400px)', borderRadius: 20, background: (s.color && s.color.bg) || CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <span aria-hidden="true" style={{ fontFamily: SERIF, fontSize: 200, lineHeight: 1, color: (s.color && s.color.fg) || PURPLE, opacity: 0.3 }}>{s.glyph}</span>
            <div style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(251,250,247,0.9)', color: MUTED, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999 }}>görsel · sonra eklenecek</div>
          </div>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            {s.catTitle && <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: PURPLE, margin: '18px 0 7px' }}>{s.catTitle}</div>}
            <div className="zk-edtitle" style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 3.6vw, 44px)', lineHeight: 1.08, color: INK }}>{s.title}</div>
            {s.snippet && <p style={{ fontSize: 15, lineHeight: 1.6, color: INK2, margin: '11px auto 0', maxWidth: 560 }}>{s.snippet}</p>}
          </div>
        </div>
      </a>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 9, marginTop: 18 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Öne çıkan ${i + 1}`}
            style={{ height: 8, width: i === idx ? 24 : 8, border: 'none', padding: 0, borderRadius: 999, background: i === idx ? INK : '#D8D2C4', cursor: 'pointer', transition: 'width .4s, background .4s' }} />
        ))}
      </div>
    </div>
  );
}

export default function BlogExplorer({ nodes = [], featured = [] }) {
  const roots = nodes.filter((n) => n.type === 'folder');
  const [sel, setSel] = useState(roots[0]?.id || '');
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [exp, setExp] = useState({});

  useEffect(() => {
    if (!menu) return;
    const h = (e) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [menu]);

  const ql = q.trim().toLowerCase();
  const selNode = findNode(nodes, sel);
  const allPages = nodes.flatMap((n) => (n.type === 'page' ? [n] : pagesUnder(n)));
  const shown = ql
    ? allPages.filter((p) => (p.title + ' ' + (p.snippet || '')).toLowerCase().includes(ql))
    : (selNode ? pagesUnder(selNode) : allPages);
  const pick = (id) => { setSel(id); setQ(''); setMenu(false); };
  const toggle = (id) => setExp((e) => ({ ...e, [id]: !e[id] }));

  const renderMenuNode = (node, depth) => {
    const kids = (node.children || []).filter((c) => c.type === 'folder');
    const hasKids = kids.length > 0;
    const isOpen = !!exp[node.id];
    const root = depth === 0;
    return (
      <div key={node.id}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {hasKids ? (
            <button onClick={() => toggle(node.id)} aria-label={isOpen ? 'Kapat' : 'Aç'} aria-expanded={isOpen}
              style={{ width: root ? 22 : 18, flex: 'none', textAlign: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: '#A7A296', fontSize: root ? 16 : 14, lineHeight: 1, padding: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</button>
          ) : (
            <span aria-hidden="true" style={{ width: root ? 22 : 18, flex: 'none' }} />
          )}
          <button onClick={() => (hasKids ? toggle(node.id) : pick(node.id))} className={root ? 'zkcathead' : 'zkcatlink'}
            style={root
              ? { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px 8px', color: '#F5F1E6' }
              : { flex: 1, minWidth: 0 }}>
            {root ? (
              <>
                <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(245,241,230,0.18)', color: '#D9CBB0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flex: 'none' }}>{node.glyph}</span>
                <span className="zkcattitle" style={{ fontFamily: SERIF, fontSize: 20.5, fontWeight: 500 }}>{node.title}</span>
              </>
            ) : (
              <>
                <span aria-hidden="true" style={{ width: 16, textAlign: 'center', flex: 'none' }}>{node.glyph}</span>
                <span style={{ flex: 1 }}>{node.title}</span>
              </>
            )}
          </button>
        </div>
        {isOpen && hasKids && (
          <div style={{ borderLeft: '1px solid rgba(245,241,230,0.13)', marginLeft: root ? 22 : 19, paddingLeft: 2 }}>
            {kids.map((k) => renderMenuNode(k, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="zk-blogx">
      <style>{`
        .zktreebtn:hover{border-color:${PURPLE};box-shadow:0 1px 0 rgba(43,29,18,0.04),0 14px 30px rgba(142,124,195,0.20);transform:translateY(-1px)}
        .zktreebtn{transition:border-color .2s,box-shadow .2s,transform .2s}
        .zk-blogx .zk-sronly{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
        .zk-blogx .zk-herofade{animation:zkherofade .5s ease}
        @keyframes zkherofade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .zk-blogx .zk-edtitle{text-decoration:underline;text-decoration-color:transparent;text-decoration-thickness:1.5px;text-underline-offset:4px;transition:text-decoration-color .25s ease}
        .zk-blogx .zk-edart:hover .zk-edtitle{text-decoration-color:var(--h-ink)}
        @media (prefers-reduced-motion: reduce){.zk-blogx .zk-herofade{animation:none}}
        .zkfull{animation:zkreveal .55s cubic-bezier(.4,0,.2,1)}
        @keyframes zkreveal{from{clip-path:circle(0% at 50% 14%);opacity:.4}to{clip-path:circle(150% at 50% 14%);opacity:1}}
        .zkfull-inner{animation:zkrise .5s .08s cubic-bezier(.4,0,.2,1) both}
        @keyframes zkrise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){.zkfull,.zkfull-inner{animation:none}}
        .zkcatlink{display:flex;align-items:center;gap:8px;text-align:left;border:none;background:transparent;cursor:pointer;border-radius:9px;padding:7px 10px;font-size:14px;color:#A7A296;transition:color .18s,background .18s}
        .zkcatlink:hover{background:rgba(245,241,230,0.07);color:#F5F1E6}
        .zkcathead .zkcattitle{transition:color .2s}
        .zkcathead:hover .zkcattitle{color:#CBBEEC}
      `}</style>

      <h1 className="zk-sronly">Gökyüzü Günlüğü — Astroloji Kütüphanesi</h1>

      {!ql && featured.length > 0 && <HeroCarousel slides={featured.slice(0, 5)} />}

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <button className="zktreebtn" onClick={() => setMenu(true)} aria-haspopup="dialog"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--h-card)', border: `1px solid ${BORDER}`, color: INK2, borderRadius: 999, padding: '11px 22px', fontSize: 15, cursor: 'pointer', fontWeight: 500 }}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>☰</span> Kütüphane ağacı
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--h-card)', border: `1px solid ${BORDER}`, borderRadius: 999, padding: '11px 18px', marginBottom: 24 }}>
        <span aria-hidden="true" style={{ color: MUTED, fontSize: 17 }}>⌕</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kütüphanede ara…" aria-label="Kütüphanede ara"
          style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 15.5, color: INK }} />
        {q && <button onClick={() => setQ('')} aria-label="Aramayı temizle" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: MUTED, fontSize: 17, lineHeight: 1 }}>×</button>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 470, fontSize: 24, margin: 0, color: INK }}>{ql ? 'Arama sonuçları' : (selNode ? selNode.title : 'Kütüphane')}</h2>
        <span style={{ marginLeft: 'auto', color: MUTED, fontSize: 13.5, whiteSpace: 'nowrap' }}>{shown.length} yazı</span>
      </div>

      {shown.length === 0 ? (
        <p style={{ color: MUTED }}>Aramanla eşleşen yazı yok. Başka bir kelime dene.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '28px 24px' }}>
          {shown.map((p) => (
            <a key={p.id} href={`/blog/yazi/${p.id}`} className="zk-edart" style={{ display: 'block', textDecoration: 'none', color: INK }}>
              <div style={{ height: 150, borderRadius: 14, background: (p.color && p.color.bg) || CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <span aria-hidden="true" style={{ fontFamily: SERIF, fontSize: 74, lineHeight: 1, color: (p.color && p.color.fg) || PURPLE, opacity: 0.3 }}>{p.glyph}</span>
              </div>
              {p.catTitle && <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: '#9A8F80', margin: '12px 0 4px' }}>{p.catTitle}</div>}
              <div className="zk-edtitle" style={{ fontFamily: SERIF, fontSize: 19, lineHeight: 1.25, color: INK }}>{p.title}</div>
              {p.snippet && <p style={{ fontSize: 13, lineHeight: 1.55, color: MUTED, margin: '6px 0 0' }}>{p.snippet}</p>}
            </a>
          ))}
        </div>
      )}

      {menu && (
        <div className="zkfull" role="dialog" aria-modal="true" aria-label="Kütüphane"
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(22,15,9,0.975)', WebkitBackdropFilter: 'blur(9px)', backdropFilter: 'blur(9px)', overflowY: 'auto', color: '#F5F1E6' }}>
          <div className="zkfull-inner" style={{ maxWidth: 1160, margin: '0 auto', padding: '52px 32px 76px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 42 }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.24em', color: '#B9A67E' }}>KÜTÜPHANE ✦</div>
                <div style={{ fontFamily: SERIF, fontWeight: 430, fontSize: 'clamp(30px, 4.4vw, 52px)', color: '#F5F1E6', lineHeight: 1.06, marginTop: 8, letterSpacing: '-0.02em' }}>Gökyüzünün sözlüğü</div>
                <p style={{ color: '#A7A296', fontSize: 15.5, lineHeight: 1.7, margin: '12px 0 0', maxWidth: 480 }}>Bir başlık aç, alt konuları gör; okumaya oradan başla. Yıldızların dili, klasörler hâlinde.</p>
              </div>
              <button onClick={() => setMenu(false)} aria-label="Kapat"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'transparent', border: '1px solid rgba(245,241,230,0.28)', color: '#F5F1E6', borderRadius: 999, padding: '10px 20px', fontSize: 14.5, cursor: 'pointer', flex: 'none' }}>
                Kapat <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>×</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '30px 28px', alignItems: 'start' }}>
              {roots.map((r) => <div key={r.id}>{renderMenuNode(r, 0)}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
