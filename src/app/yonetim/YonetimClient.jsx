'use client';
// Yönetim girişi (client). Anahtar = ADMIN_TOKEN (Vercel env'indeki değerle aynı) → sessionStorage.
// Giriş sonrası: sayfalara git, sağ altta ✎ Düzenle çıkar. Anahtar tarayıcıda kalır (sekme kapanınca silinir).
import { useState, useEffect } from 'react';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle, btnPrimary, cardStyle } from '@/components/Chrome';

const KEY = 'h_admin_key';
const PAGES = [
  { href: '/', ad: 'Ana Sayfa' }, { href: '/ozellikler', ad: 'Özellikler' },
  { href: '/fiyat', ad: 'Fiyat' }, { href: '/indir', ad: 'İndir' }, { href: '/sss', ad: 'SSS' }
];

export default function YonetimClient() {
  const [k, setK] = useState('');
  const [inside, setInside] = useState(false);

  useEffect(() => { try { setInside(!!sessionStorage.getItem(KEY)); } catch {} }, []);

  const giris = (e) => {
    e.preventDefault();
    if (!k.trim()) return;
    try { sessionStorage.setItem(KEY, k.trim()); } catch {}
    setInside(true); setK('');
  };
  const cikis = () => { try { sessionStorage.removeItem(KEY); } catch {} setInside(false); };

  const field = { width: '100%', marginTop: 6, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', fontSize: 15, background: T.paper, color: T.ink, fontFamily: 'inherit' };

  return (
    <main>
      <Nav active="/yonetim" />
      <section style={{ ...sectionStyle, paddingTop: 72, paddingBottom: 60, maxWidth: 620 }}>
        <div style={kickerStyle}>YÖNETİM</div>
        <h1 style={h1Style}>İçerik paneli</h1>

        {!inside ? (
          <form onSubmit={giris} style={{ ...cardStyle, marginTop: 24 }}>
            <p style={{ ...pStyle, marginTop: 0 }}>Yönetim anahtarını gir. Bu, Vercel’de tanımlı <code>ADMIN_TOKEN</code> değeridir. Giriş sonrası sayfalara gidince sağ altta <b>✎ Düzenle</b> düğmesi çıkar; metne tıklayıp yerinde düzenlersin.</p>
            <label style={{ display: 'block', fontSize: 13.5, color: T.muted, marginTop: 8 }}>Yönetim anahtarı
              <input type="password" value={k} onChange={(e) => setK(e.target.value)} style={field} placeholder="ADMIN_TOKEN" autoComplete="off" />
            </label>
            <button type="submit" style={{ ...btnPrimary, marginTop: 18, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>Gir</button>
          </form>
        ) : (
          <div style={{ ...cardStyle, marginTop: 24 }}>
            <p style={{ ...pStyle, marginTop: 0 }}>Giriş yapıldı ✓ Düzenlemek istediğin sayfaya git — sağ altta <b>✎ Düzenle</b> ve <b>⚙ SEO</b> çıkacak. Metne tıkla, yaz, <b>💾 Kaydet</b>’e bas. Değişiklik canlıya yazılır; SEO/GEO (meta, JSON-LD, llms.txt) otomatik güncellenir.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
              {PAGES.map((p) => <a key={p.href} href={p.href} style={{ border: `1px solid ${T.border}`, borderRadius: 999, padding: '9px 16px', textDecoration: 'none', color: T.ink, fontSize: 14 }}>{p.ad} →</a>)}
            </div>
            <button type="button" onClick={cikis} style={{ marginTop: 20, background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Çıkış yap</button>
          </div>
        )}

        <p style={{ fontSize: 13, color: T.muted, marginTop: 22 }}>Not: Bu sayfa arama motorlarına kapalıdır (noindex). Anahtarı kimseyle paylaşma.</p>
      </section>
      <Footer />
    </main>
  );
}
