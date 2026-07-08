'use client';
// İletişim formu — Iletisim.dc.html'deki akışın API sürümü: POST /api/leads
// (prototipte zk_admin_talep'e push ediliyordu; kayıt şekli aynı: type='İletişim · <konu>').
import { useState } from 'react';

const KONULAR = ['Danışmanlık', 'Programlar (AstroPen / Hermes)', 'Eğitim & Astroloji 101', 'İş birliği', 'Diğer'];

const field = { border: '1px solid #E8E3D6', borderRadius: 10, padding: '13px 15px', fontSize: 15, fontFamily: 'inherit', background: '#FFFFFF', color: '#2B1D12' };
const label = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: '#6B675E' };

export default function IletisimForm() {
  const [f, setF] = useState({ name: '', email: '', konu: KONULAR[0], message: '', kvkk: false });
  const [state, setState] = useState('idle'); // idle | sending | done | error

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!f.kvkk || state === 'sending') return;
    setState('sending');
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Date.now(), name: f.name.trim(), email: f.email.trim(), type: 'İletişim · ' + f.konu, message: f.message.trim(), date: new Date().toISOString().slice(0, 10) })
      });
      setState(r.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div style={{ background: '#F4F1E8', border: '1px solid #E8E3D6', borderRadius: 22, padding: '44px 40px' }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 28 }}>Mesajın ulaştı ✳</div>
        <p style={{ fontSize: 15.5, lineHeight: 1.7, color: '#3A2D20', marginTop: 12 }}>En geç iki iş günü içinde {f.email} adresine dönüş yapılır.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: '#FFFFFF', border: '1px solid #E8E3D6', borderRadius: 22, padding: '34px 34px 38px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <label style={label}>Adın
        <input required value={f.name} onChange={set('name')} style={field} placeholder="Ad Soyad" />
      </label>
      <label style={label}>E-posta
        <input required type="email" value={f.email} onChange={set('email')} style={field} placeholder="ornek@eposta.com" />
      </label>
      <label style={{ ...label, gridColumn: '1 / -1' }}>Konu
        <select value={f.konu} onChange={set('konu')} style={field}>
          {KONULAR.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>
      <label style={{ ...label, gridColumn: '1 / -1' }}>Mesajın
        <textarea required rows={6} value={f.message} onChange={set('message')} style={{ ...field, resize: 'vertical' }} placeholder="Merhaba…" />
      </label>
      <label style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: '#55524A', lineHeight: 1.6 }}>
        <input required type="checkbox" checked={f.kvkk} onChange={set('kvkk')} style={{ width: 18, height: 18, marginTop: 2 }} />
        <span>Kişisel verilerimin <a href="/yasal/kvkk" style={{ color: '#8E7CC3' }}>KVKK Aydınlatma Metni</a> kapsamında işlenmesini kabul ediyorum.</span>
      </label>
      <button type="submit" disabled={state === 'sending'} style={{ gridColumn: '1 / -1', background: '#1D130B', color: '#F5F1E6', border: 'none', borderRadius: 999, padding: '15px 30px', fontSize: 15.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: state === 'sending' ? 0.6 : 1 }}>
        {state === 'sending' ? 'Gönderiliyor…' : 'Gönder'}
      </button>
      {state === 'error' && <p style={{ gridColumn: '1 / -1', color: '#B04A3A', fontSize: 14, margin: 0 }}>Gönderilemedi — lütfen tekrar dene ya da merhaba@zerdemkartal.com adresine yaz.</p>}
    </form>
  );
}
