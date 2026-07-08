'use client';
// Doğum haritası aracı — İSTEMCİ bileşeni.
// TAM PORT KAYNAĞI: prototip "Dogum Haritasi.dc.html" logic'i —
//   • hesap: await import('https://cdn.jsdelivr.net/npm/circular-natal-horoscope-js@1.1.0/+esm')
//     → mod.default.{Origin, Horoscope} (DİKKAT: Origin month 0-11)
//   • 81 il + 16 dünya şehri lat/lon tablosu (Component.CITIES)
//   • SVG çark (_drawWheel: ASC solda, glifler \uFE0E ile), 13 satırlık gezegen tablosu,
//     TR kısa okuma (Component.ESSENCE), PDF = window.print
// Bu iskelet sürüm formu + kütüphane yüklemesini kurar; çark/tablo render'ı prototipten
// birebir taşınacak (görsel referans .dc.html'dir).
import { useState } from 'react';

export default function HaritaAraci() {
  const [msg, setMsg] = useState('');

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8E3D6', borderRadius: 22, padding: '34px 34px 38px', maxWidth: 720 }}>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 24 }}>Doğum bilgilerin</div>
      <form
        onSubmit={(e) => { e.preventDefault(); setMsg('Hesaplama motoru bu iskelette henüz bağlı değil — "Dogum Haritasi.dc.html" logic\u0027i buraya port edilecek (dosya başındaki not).'); }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: '#6B675E' }}>
          Doğum tarihi
          <input required type="date" name="tarih" style={{ border: '1px solid #E8E3D6', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: '#6B675E' }}>
          Doğum saati
          <input required type="time" name="saat" style={{ border: '1px solid #E8E3D6', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit' }} />
        </label>
        <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: '#6B675E' }}>
          Doğum yeri
          <input required type="text" name="yer" placeholder="İstanbul" style={{ border: '1px solid #E8E3D6', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit' }} />
        </label>
        <button type="submit" style={{ gridColumn: '1 / -1', background: '#1D130B', color: '#F5F1E6', border: 'none', borderRadius: 999, padding: '14px 28px', fontSize: 15.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Haritanı çıkar
        </button>
      </form>
      {msg && <p style={{ marginTop: 16, fontSize: 14, color: '#8E7CC3' }}>{msg}</p>}
    </div>
  );
}
