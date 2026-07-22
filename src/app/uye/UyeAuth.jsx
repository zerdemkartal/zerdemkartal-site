'use client';
// Üye ol / giriş — Uye.dc.html auth akışının API sürümü:
//   POST /api/uye/register · POST /api/uye/login · GET /api/uye/me (Bearer)
// Token localStorage 'zk_uye_jwt'te tutulur (prototipteki zk_uye_oturum'un karşılığı).
// Google girişi: GIS id_token → POST /api/uye/google (sunucu doğrular) — buton, GOOGLE_CLIENT_ID
// public env'i (NEXT_PUBLIC_GOOGLE_CLIENT_ID) tanımlıysa GIS script'iyle bağlanır.
import { useEffect, useState } from 'react';

const field = { border: '1px solid var(--h-border)', borderRadius: 10, padding: '13px 15px', fontSize: 15, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
const label = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: 'var(--h-muted)' };

export default function UyeAuth() {
  const [tab, setTab] = useState('signup');
  const [f, setF] = useState({ name: '', email: '', pass: '', birth: '', kvkk: false });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('zk_uye_jwt');
    if (!t) return;
    fetch('/api/uye/me', { headers: { Authorization: 'Bearer ' + t } })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => m && setMember(m.member || m))
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setErr('');
    if (tab === 'signup' && !f.kvkk) { setErr('Devam etmek için KVKK onayı gerekli.'); return; }
    setBusy(true);
    try {
      const url = tab === 'signup' ? '/api/uye/register' : '/api/uye/login';
      const body = tab === 'signup'
        ? { name: f.name.trim(), email: f.email.trim(), pass: f.pass, ...(f.birth ? { birth: f.birth } : {}) }
        : { email: f.email.trim(), pass: f.pass };
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.error || 'Bir şeyler ters gitti — tekrar dene.'); return; }
      localStorage.setItem('zk_uye_jwt', d.token);
      setMember(d.member);
    } catch {
      setErr('Sunucuya ulaşılamadı.');
    } finally {
      setBusy(false);
    }
  }

  function signout() {
    localStorage.removeItem('zk_uye_jwt');
    setMember(null);
  }

  if (member) {
    return (
      <div style={{ background: 'var(--h-card)', border: '1px solid var(--h-border)', borderRadius: 22, padding: '34px 34px 38px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--h-accentbg)', display: 'grid', placeItems: 'center', fontFamily: "'Newsreader', serif", fontSize: 24 }}>
          {(member.name || '?').slice(0, 1).toUpperCase()}
        </div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 26, marginTop: 16 }}>Merhaba, {member.name}</div>
        <div style={{ color: 'var(--h-muted)', fontSize: 14, marginTop: 4 }}>{member.email}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          <a href="/indir" style={{ border: '1px solid var(--h-border)', borderRadius: 12, padding: '13px 16px', color: 'var(--h-ink)', textDecoration: 'none', fontSize: 15 }}>⇩ Hermes’i indir &amp; kur</a>
          <a href="/sss" style={{ border: '1px solid var(--h-border)', borderRadius: 12, padding: '13px 16px', color: 'var(--h-ink)', textDecoration: 'none', fontSize: 15 }}>☿&#xFE0E; SSS &amp; destek</a>
        </div>
        <button onClick={signout} style={{ marginTop: 22, background: 'none', border: 'none', color: 'var(--h-muted)', fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>Çıkış yap</button>
      </div>
    );
  }

  const tabBtn = (id, text) => (
    <button type="button" onClick={() => { setTab(id); setErr(''); }} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, background: tab === id ? 'var(--h-dark)' : 'transparent', color: tab === id ? 'var(--h-dark-text)' : 'var(--h-muted)' }}>{text}</button>
  );

  return (
    <form onSubmit={submit} style={{ background: 'var(--h-card)', border: '1px solid var(--h-border)', borderRadius: 22, padding: '26px 28px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 6, background: 'var(--h-cream)', borderRadius: 12, padding: 5 }}>
        {tabBtn('signup', 'Üye ol')}
        {tabBtn('signin', 'Giriş yap')}
      </div>
      {tab === 'signup' && (
        <label style={label}>Adın
          <input required value={f.name} onChange={set('name')} style={field} placeholder="Ad Soyad" />
        </label>
      )}
      <label style={label}>E-posta
        <input required type="email" value={f.email} onChange={set('email')} style={field} placeholder="ornek@eposta.com" />
      </label>
      <label style={label}>Şifre
        <input required type="password" minLength={6} value={f.pass} onChange={set('pass')} style={field} placeholder="••••••" />
      </label>
      {tab === 'signup' && (
        <>
          <label style={label}>Doğum tarihi <span style={{ fontWeight: 400 }}>(isteğe bağlı — harita kısayolu için)</span>
            <input type="date" value={f.birth} onChange={set('birth')} style={field} />
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--h-muted)', lineHeight: 1.6 }}>
            <input type="checkbox" checked={f.kvkk} onChange={set('kvkk')} style={{ width: 18, height: 18, marginTop: 2 }} />
            <span>Kişisel verilerimin <a href="/yasal/kvkk" style={{ color: 'var(--h-accent)' }}>KVKK Aydınlatma Metni</a> kapsamında işlenmesini kabul ediyorum.</span>
          </label>
        </>
      )}
      {err && <p style={{ color: '#B04A3A', fontSize: 13.5, margin: 0 }}>{err}</p>}
      <button type="submit" disabled={busy} style={{ background: 'var(--h-dark)', color: 'var(--h-dark-text)', border: 'none', borderRadius: 999, padding: '14px 0', fontSize: 15.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Bekle…' : tab === 'signup' ? 'Üye ol' : 'Giriş yap'}
      </button>
    </form>
  );
}
