'use client';
// Yerinde (WYSIWYG) düzenleme katmanı — eski .dc.html panelinin SSR karşılığı.
// Çalışma: /yonetim'den "Yönetim anahtarı" (ADMIN_TOKEN) girilir → sessionStorage 'h_admin_key'.
// Bu bileşen layout'ta global mount edilir; anahtar yoksa HİÇBİR ŞEY render etmez (ziyaretçi normal görür).
// Anahtar varsa sağ altta araç çubuğu çıkar: ✎ Düzenle (metne tıkla-yaz) · ⚙ SEO · 💾 Kaydet · Çıkış.
// Kaydet: GET hermes_site → değişen data-path'leri setPath ile uygula → PUT (Bearer anahtar). Bütünü
// yazar (oku-birleştir-yaz), böylece hiçbir alan silinmez. SEO/GEO: seo.<sayfa> alanları da buradan.
import { useState, useEffect, useRef, useCallback } from 'react';

const KEY = 'h_admin_key';
const SEO_MAP = { '/': 'home', '/ozellikler': 'ozellikler', '/fiyat': 'fiyat', '/indir': 'indir', '/sss': 'sss' };
const SEO_LABEL = { home: 'Ana Sayfa', ozellikler: 'Özellikler', fiyat: 'Fiyat', indir: 'İndir', sss: 'SSS' };

// 'a.b.2.c' → iç içe nesne/dizi; sayısal segment = dizi indeksi
function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const nextIdx = /^\d+$/.test(parts[i + 1]);
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = nextIdx ? [] : {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export default function EditLayer() {
  const [key, setKey] = useState(null);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [seo, setSeo] = useState(null); // {title, description} | null(kapalı)
  const changes = useRef({});
  const pageKey = typeof window !== 'undefined' ? SEO_MAP[window.location.pathname] : undefined;

  useEffect(() => { try { setKey(sessionStorage.getItem(KEY)); } catch {} }, []);

  // Düzenleme aç/kapa → [data-he] öğeleri contentEditable
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-he]'));
    nodes.forEach((n) => {
      if (editing) { n.setAttribute('contenteditable', 'true'); n.classList.add('he-on'); }
      else { n.removeAttribute('contenteditable'); n.classList.remove('he-on'); }
    });
    if (!editing) return;
    const onInput = (e) => {
      const el = e.target.closest && e.target.closest('[data-he]');
      if (!el) return;
      const p = el.getAttribute('data-path'); if (!p) return;
      changes.current[p] = el.innerText.replace(/\s+\n/g, '\n').trim();
      setDirty((d) => d + 1);
    };
    const onClick = (e) => { const a = e.target.closest && e.target.closest('a[data-he]'); if (a) e.preventDefault(); };
    const onKey = (e) => { // tek satırlık alanlarda Enter yeni satır açmasın
      if (e.key === 'Enter' && e.target.closest && e.target.closest('[data-he]')) { e.preventDefault(); e.target.blur(); }
    };
    document.addEventListener('input', onInput, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [editing]);

  const fetchModel = async () => {
    const r = await fetch('/api/content/hermes_site', { cache: 'no-store' });
    const j = await r.json();
    return j && typeof j === 'object' ? j : {};
  };

  const save = useCallback(async (extra) => {
    if (!key) { setMsg('Önce /yonetim’den giriş yap'); return false; }
    setSaving(true); setMsg('');
    try {
      const model = await fetchModel();
      const all = { ...changes.current, ...(extra || {}) };
      Object.entries(all).forEach(([p, v]) => setPath(model, p, v));
      const res = await fetch('/api/content/hermes_site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify(model)
      });
      if (res.ok) { changes.current = {}; setDirty(0); setMsg('Kaydedildi ✓'); setSaving(false); return true; }
      setMsg(res.status === 401 ? 'Anahtar geçersiz' : 'Kaydedilemedi (' + res.status + ')');
    } catch { setMsg('Bağlantı hatası'); }
    setSaving(false); return false;
  }, [key]);

  const openSeo = async () => {
    if (!pageKey) { setMsg('Bu sayfada SEO düzenlenmez'); return; }
    try {
      const model = await fetchModel();
      const cur = getPath(model, 'seo.' + pageKey) || {};
      setSeo({ title: cur.title || '', description: cur.description || '' });
    } catch { setSeo({ title: '', description: '' }); }
  };
  const saveSeo = async () => {
    const ok = await save({ ['seo.' + pageKey + '.title']: seo.title, ['seo.' + pageKey + '.description']: seo.description });
    if (ok) setSeo(null);
  };

  if (!key) return null; // ziyaretçi / girişsiz → görünmez

  const btn = { border: '1px solid var(--h-border)', background: 'var(--h-card)', color: 'var(--h-ink)', borderRadius: 10, padding: '8px 12px', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 };
  const btnOn = { ...btn, background: 'var(--h-accent-text)', color: 'var(--h-accent-ink)', borderColor: 'transparent' };

  return (
    <>
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9000, display: 'flex', gap: 8, alignItems: 'center', background: 'var(--h-card)', border: '1px solid var(--h-border)', borderRadius: 14, padding: '8px 10px', boxShadow: '0 12px 34px var(--h-shadow)', fontFamily: "'Hanken Grotesk', sans-serif" }} data-noindex="1">
        <button type="button" style={editing ? btnOn : btn} onClick={() => setEditing((v) => !v)} title="Metne tıklayıp düzenle">{editing ? '✓ Düzenleniyor' : '✎ Düzenle'}</button>
        {pageKey && <button type="button" style={btn} onClick={openSeo} title="Sayfa SEO/GEO">⚙ SEO</button>}
        <button type="button" style={{ ...btn, opacity: dirty ? 1 : 0.5 }} disabled={!dirty || saving} onClick={() => save()}>{saving ? '…' : '💾 Kaydet' + (dirty ? ' (' + dirty + ')' : '')}</button>
        {msg && <span style={{ fontSize: 12.5, color: 'var(--h-muted)', maxWidth: 150 }}>{msg}</span>}
        <button type="button" style={{ ...btn, border: 'none', background: 'none', color: 'var(--h-muted)' }} onClick={() => { try { sessionStorage.removeItem(KEY); } catch {} setKey(null); }} title="Çıkış">Çıkış</button>
      </div>

      {seo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setSeo(null); }}>
          <div style={{ background: 'var(--h-card)', border: '1px solid var(--h-border)', borderRadius: 18, padding: 26, width: 'min(520px,100%)', fontFamily: "'Hanken Grotesk', sans-serif" }} role="dialog" aria-modal="true">
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, color: 'var(--h-ink)' }}>SEO · {SEO_LABEL[pageKey]}</div>
            <p style={{ fontSize: 13, color: 'var(--h-muted)', marginTop: 4 }}>Bu alanlar sayfanın meta etiketini, JSON-LD’sini ve llms.txt’sini besler (SEO+GEO otomatik güncellenir).</p>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--h-muted)', marginTop: 16 }}>Başlık (title) · {(seo.title || '').length}/60
              <input value={seo.title} onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))} style={{ width: '100%', marginTop: 5, border: '1px solid var(--h-border)', borderRadius: 9, padding: '10px 12px', fontSize: 14, background: 'var(--h-bg)', color: 'var(--h-ink)', fontFamily: 'inherit' }} />
            </label>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--h-muted)', marginTop: 12 }}>Açıklama (description) · {(seo.description || '').length}/160
              <textarea value={seo.description} onChange={(e) => setSeo((s) => ({ ...s, description: e.target.value }))} rows={3} style={{ width: '100%', marginTop: 5, border: '1px solid var(--h-border)', borderRadius: 9, padding: '10px 12px', fontSize: 14, background: 'var(--h-bg)', color: 'var(--h-ink)', fontFamily: 'inherit', resize: 'vertical' }} />
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={saveSeo} disabled={saving} style={btnOn}>{saving ? 'Kaydediliyor…' : 'SEO’yu kaydet'}</button>
              <button type="button" onClick={() => setSeo(null)} style={{ ...btn, border: 'none', background: 'none', color: 'var(--h-muted)' }}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
