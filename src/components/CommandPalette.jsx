'use client';
// KOMUT PALETİ (⌘K / Ctrl+K) — Faz 3 (27 Tem 2026). Bağımlılık YOK.
//
// Ne yapar: site içi hızlı gezinme + arama. Sabit rotalar her zaman hazır; içerik
// (özellik grupları/maddeleri, SSS soruları, blog başlıkları) ilk açılışta bir kez
// çekilir ve modül kapsamında önbelleğe alınır.
//
// Veri kaynakları (ikisi de PUBLIC GET):
//   /api/content/hermes_site → DB satırı yoksa defaults.js modelini döner
//   /api/blog/tree           → yalnız yayındaki yazılar
// Her ikisi de başarısız olursa palet sabit rotalarla çalışmaya devam eder — arama
// kutusu asla "boş/ölü" görünmez.
//
// Erişilebilirlik: role=dialog + aria-modal, açılışta odak arama kutusunda, Esc kapatır,
// kapanışta odak tetikleyen düğmeye döner, ok tuşlarıyla gezinme, aktif satır aria-selected.
// SEO notu: palet salt gezinme aracıdır; içeriğin kendisi zaten SSR sayfalarında basılıdır.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// ⚠ Katman PORTAL ile document.body'ye basılır. Sebep: düğme nav'ın içinde, nav ise
// SmartNav'ın transform uygulayabildiği bir sarmalayıcıda. Transform'lu bir ata,
// position:fixed çocuğun referans çerçevesini değiştirir → palet ekran dışına kayardı.
import { createPortal } from 'react-dom';

// —— Türkçe duyarlı normalleştirme (İ/ı, ş, ğ, ç, ö, ü) ——
function norm(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const SABIT = [
  { g: 'Sayfalar', t: 'Ana Sayfa', h: '/', k: 'anasayfa hermes' },
  { g: 'Sayfalar', t: 'Özellikler', h: '/ozellikler', k: 'modüller ne yapar' },
  { g: 'Sayfalar', t: 'Fiyat', h: '/fiyat', k: 'ücret lisans satın al ön sipariş' },
  { g: 'Sayfalar', t: 'İndir', h: '/indir', k: 'kurulum sürüm windows' },
  { g: 'Sayfalar', t: 'Blog', h: '/blog', k: 'yazılar makale' },
  { g: 'Sayfalar', t: 'Sık Sorulan Sorular', h: '/sss', k: 'sss soru cevap' },
  { g: 'Sayfalar', t: 'İletişim', h: '/iletisim', k: 'mail yaz destek' },
  { g: 'Sayfalar', t: 'Geliştiricisi hakkında', h: '/hakkimda', k: 'zerdem kartal astrolog' },
  { g: 'Sayfalar', t: 'Üye girişi', h: '/uye', k: 'hesap giriş kayıt' },
  { g: 'Yasal', t: 'KVKK', h: '/yasal/kvkk', k: 'kişisel veri' },
  { g: 'Yasal', t: 'Gizlilik & Çerez', h: '/yasal/gizlilik', k: 'çerez privacy' },
  { g: 'Yasal', t: 'Mesafeli Satış', h: '/yasal/mesafeli-satis', k: 'sözleşme' },
  { g: 'Yasal', t: 'İptal & İade', h: '/yasal/iade', k: 'geri ödeme' }
];

let ONBELLEK = null; // modül kapsamı: sekme ömrü boyunca bir kez çekilir

async function indeksYukle() {
  if (ONBELLEK) return ONBELLEK;
  const ek = [];

  try {
    const r = await fetch('/api/content/hermes_site', { cache: 'force-cache' });
    if (r.ok) {
      const c = await r.json();
      for (const g of c?.ozellikler?.gruplar || []) {
        ek.push({ g: 'Modüller', t: g.baslik, h: `/ozellikler#${g.id}`, k: g.giris || '' });
        for (const x of g.items || []) {
          ek.push({ g: 'Özellikler', t: x.ad, h: `/ozellikler#${g.id}`, k: `${g.baslik} ${x.desc || ''}` });
        }
      }
      for (const s of c?.sss?.items || []) ek.push({ g: 'SSS', t: s.q, h: '/sss', k: s.a || '' });
    }
  } catch { /* içerik ucu yoksa sabit rotalarla devam */ }

  try {
    const r = await fetch('/api/blog/tree', { cache: 'force-cache' });
    if (r.ok) {
      const agac = await r.json();
      const gez = (dugumler) => {
        for (const n of dugumler || []) {
          if (n.type === 'page') ek.push({ g: 'Blog', t: n.title, h: `/blog/yazi/${n.id}`, k: n.excerpt || '' });
          if (n.children) gez(n.children);
        }
      };
      gez(Array.isArray(agac) ? agac : agac?.nodes);
    }
  } catch { /* blog ucu yoksa sessizce geç */ }

  ONBELLEK = ek;
  return ek;
}

export default function CommandPalette() {
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState('');
  const [ekstra, setEkstra] = useState([]);
  const [aktif, setAktif] = useState(0);
  const [bindi, setBindi] = useState(false); // SSR'da portal yok
  const girdiRef = useRef(null);
  const listeRef = useRef(null);
  const doner = useRef(null); // kapanışta odağın döneceği düğme

  const ac = useCallback(() => { doner.current = document.activeElement; setAcik(true); }, []);
  const kapat = useCallback(() => {
    setAcik(false); setQ(''); setAktif(0);
    if (doner.current && doner.current.focus) doner.current.focus();
  }, []);

  useEffect(() => { setBindi(true); }, []);

  // Global kısayol: ⌘K / Ctrl+K (yazı alanındayken de çalışır — standart davranış)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setAcik((v) => { if (!v) doner.current = document.activeElement; return !v; });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Açılınca: indeksi çek, odağı kutuya al, arka plan kaydırmasını kilitle
  useEffect(() => {
    if (!acik) return;
    let iptal = false;
    indeksYukle().then((v) => { if (!iptal) setEkstra(v); });
    const t = setTimeout(() => girdiRef.current && girdiRef.current.focus(), 20);
    const eskiOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { iptal = true; clearTimeout(t); document.body.style.overflow = eskiOverflow; };
  }, [acik]);

  const tum = useMemo(() => SABIT.concat(ekstra), [ekstra]);

  const sonuc = useMemo(() => {
    const s = norm(q).trim();
    if (!s) return tum.slice(0, 9);
    const kelimeler = s.split(/\s+/);
    const puanli = [];
    for (const it of tum) {
      const baslik = norm(it.t);
      const govde = norm(`${it.t} ${it.k} ${it.g}`);
      if (!kelimeler.every((w) => govde.includes(w))) continue;
      // Başlıkta baştan eşleşme > başlıkta geçiyor > yalnız gövdede
      const p = baslik.startsWith(s) ? 0 : baslik.includes(s) ? 1 : 2;
      puanli.push([p, it]);
    }
    puanli.sort((a, b) => a[0] - b[0]);
    return puanli.slice(0, 24).map((x) => x[1]);
  }, [q, tum]);

  useEffect(() => { setAktif(0); }, [q]);

  // Aktif satırı görünür tut
  useEffect(() => {
    const l = listeRef.current;
    if (!l) return;
    const el = l.querySelector('[data-aktif="1"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [aktif, sonuc]);

  function git(it) { if (it) { kapat(); window.location.href = it.h; } }

  function onKutuKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); kapat(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setAktif((i) => (sonuc.length ? (i + 1) % sonuc.length : 0)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setAktif((i) => (sonuc.length ? (i - 1 + sonuc.length) % sonuc.length : 0)); return; }
    if (e.key === 'Enter') { e.preventDefault(); git(sonuc[aktif]); }
  }

  return (
    <>
      <button type="button" className="h-cmdbtn" onClick={ac}
        aria-label="Sitede ara (Ctrl veya Command + K)" title="Ara — ⌘K">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" strokeLinecap="round" />
        </svg>
        <span className="h-cmdbtn-t">Ara</span>
        <kbd>⌘K</kbd>
      </button>

      {acik && bindi && createPortal((
        <div className="h-cmd-arka" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
          <div className="h-cmd" role="dialog" aria-modal="true" aria-label="Site içi arama">
            <div className="h-cmd-ust">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" strokeLinecap="round" />
              </svg>
              <input ref={girdiRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKutuKey}
                placeholder="Sayfa, modül, soru ya da yazı ara…" aria-label="Arama"
                aria-controls="h-cmd-liste" autoComplete="off" spellCheck="false" />
              <button type="button" onClick={kapat} aria-label="Kapat">esc</button>
            </div>

            <div className="h-cmd-liste" id="h-cmd-liste" ref={listeRef} role="listbox">
              {sonuc.length === 0 ? (
                <div className="h-cmd-bos">Eşleşen bir şey yok. Farklı bir kelime deneyin.</div>
              ) : sonuc.map((it, i) => {
                const oncekiGrup = i > 0 ? sonuc[i - 1].g : null;
                return (
                  <div key={`${it.h}-${i}`}>
                    {it.g !== oncekiGrup && <div className="h-cmd-grup">{it.g}</div>}
                    <a href={it.h} role="option" aria-selected={i === aktif} data-aktif={i === aktif ? '1' : '0'}
                      className={`h-cmd-sat${i === aktif ? ' on' : ''}`}
                      onMouseEnter={() => setAktif(i)}
                      onClick={(e) => { e.preventDefault(); git(it); }}>
                      <span className="h-cmd-t">{it.t}</span>
                      <span className="h-cmd-h">{it.h}</span>
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="h-cmd-alt">
              <span><kbd>↑</kbd><kbd>↓</kbd> gez</span>
              <span><kbd>↵</kbd> git</span>
              <span><kbd>esc</kbd> kapat</span>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
