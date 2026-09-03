'use client';
// Ön sipariş akışı (H2) — /fiyat CTA'sı. Ad + e-posta toplar → POST /api/orders (pending Order).
// Ödeme sağlayıcısı (iyzico/PayTR) 🔴 kullanıcıda; bağlanınca bu adım ödeme sayfasına yönlendirir.
// Şimdilik dürüst ÖN SİPARİŞ: kayıt oluşur, ödeme bağlantısı e-postayla iletilir (sahte kart adımı YOK).
import { useState, useEffect } from 'react';
import { LICENSE_DEVICE_PRICES, LICENSE_SECOND_DEVICE_PRICE } from '@/lib/licensePricing';

const overlay = { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center', padding: 20 };
const modal = { background: 'var(--h-card)', border: '1px solid var(--h-border)', borderRadius: 22, padding: '30px 30px 34px', width: 'min(460px, 100%)', maxHeight: '90vh', overflowY: 'auto' };
const field = { width: '100%', border: '1px solid var(--h-border)', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', background: 'var(--h-bg)', color: 'var(--h-ink)' };
const label = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: 'var(--h-muted)', marginTop: 12 };
const btnPri = { background: 'var(--h-accent-text)', color: 'var(--h-accent-ink)', borderRadius: 999, padding: '13px 26px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 };
const planGrid = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 16 };
const planButton = { minWidth: 0, padding: '13px 14px', borderRadius: 13, border: '1px solid var(--h-border)', background: 'var(--h-bg)', color: 'var(--h-ink2)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' };

const tryLabel = (value) => `₺${Number(value).toLocaleString('tr-TR')}`;

export default function OnSiparis({ label: cta = 'Ön sipariş ver', price = LICENSE_DEVICE_PRICES[1], secondPrice = LICENSE_DEVICE_PRICES[2] }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', email: '', kvkk: false, deviceLimit: 1 });
  const [state, setState] = useState('form'); // form | sending | done | error
  const [errMsg, setErrMsg] = useState('');
  const selectedPrice = f.deviceLimit === 2 ? Number(secondPrice) || LICENSE_DEVICE_PRICES[2] : Number(price) || LICENSE_DEVICE_PRICES[1];

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim() || !f.kvkk || state === 'sending') return;
    setState('sending'); setErrMsg('');
    const payload = {
      name: f.name.trim(),
      email: f.email.trim(),
      product: `Hermes — ${f.deviceLimit} cihaz`,
      deviceLimit: f.deviceLimit
    };
    try {
      // 1) iyzico ödeme sayfasını başlatmayı dene
      const r = await fetch('/api/pay/iyzico/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (r.ok) {
        const d = await r.json().catch(() => null);
        if (d && d.paymentPageUrl) { window.location.href = d.paymentPageUrl; return; } // iyzico'ya yönlendir
        setErrMsg('Ödeme sayfası adresi alınamadı.'); setState('error'); return;
      }
      // 2) iyzico henüz yapılandırılmadıysa (503) → dürüst ön sipariş kaydı
      if (r.status === 503) {
        const r2 = await fetch('/api/orders', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!r2.ok) setErrMsg('Sipariş kaydı oluşturulamadı.');
        setState(r2.ok ? 'done' : 'error');
        return;
      }
      // 3) diğer hatalar → iyzico/sunucu mesajını göster
      const d = await r.json().catch(() => null);
      setErrMsg((d && d.error) ? String(d.error) : ('Sunucu hatası (' + r.status + ')'));
      setState('error');
    } catch (err) { setErrMsg('Bağlantı hatası: ' + (err?.message || '')); setState('error'); }
  }

  function close() {
    setOpen(false);
    setTimeout(() => {
      setState('form');
      setF({ name: '', email: '', kvkk: false, deviceLimit: 1 });
    }, 200);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{ ...btnPri, marginTop: 20 }}>{cta}</button>

      {open && (
        <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div style={modal} role="dialog" aria-modal="true" aria-label="Ön sipariş">
            {state === 'done' ? (
              <div>
                <div style={{ fontFamily: "'Newsreader', serif", fontSize: 26, color: 'var(--h-ink)' }}>Ön siparişin alındı ☿&#xFE0E;</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--h-ink2)', marginTop: 12 }}>
                  Teşekkürler {f.name.trim()}. <b>{f.email.trim()}</b> adresine ödeme bağlantısı gönderilecek. Ödemen alınınca kurulum dosyası ve lisans etkinleştirme adımların e-postana iletilir.
                </p>
                <p style={{ fontSize: 14, color: 'var(--h-muted)', marginTop: 10 }}>
                  Seçimin: <b>{f.deviceLimit} cihaz · {tryLabel(selectedPrice)}</b>
                </p>
                <button type="button" onClick={close} style={{ ...btnPri, marginTop: 22 }}>Kapat</button>
              </div>
            ) : state === 'error' ? (
              <div>
                <div style={{ fontFamily: "'Newsreader', serif", fontSize: 24, color: 'var(--h-ink)' }}>Bir şey ters gitti</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--h-ink2)', marginTop: 12 }}>{errMsg || 'İşlem tamamlanamadı. Tekrar dene ya da iletişim formundan yaz.'}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => setState('form')} style={btnPri}>Tekrar dene</button>
                  <a href="/iletisim" style={{ alignSelf: 'center', color: 'var(--h-accent-text)' }}>İletişim</a>
                </div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ fontFamily: "'Newsreader', serif", fontSize: 24, color: 'var(--h-ink)' }}>Ön sipariş</div>
                <p style={{ fontSize: 14, color: 'var(--h-muted)', marginTop: 6 }}>Hermes program lisansı tek seferliktir ve seçilen cihaz sayısı için düzenlenir. Farklı cihaz ayrı lisans gerektirir.</p>
                <div role="group" aria-label="Cihaz sayısı" style={planGrid}>
                  {[
                    { limit: 1, title: '1 cihaz', amount: Number(price) || LICENSE_DEVICE_PRICES[1] },
                    { limit: 2, title: `2 cihaz (+₺${LICENSE_SECOND_DEVICE_PRICE.toLocaleString('tr-TR')})`, amount: Number(secondPrice) || LICENSE_DEVICE_PRICES[2] }
                  ].map((plan) => {
                    const active = f.deviceLimit === plan.limit;
                    return (
                      <button
                        key={plan.limit}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setF((s) => ({ ...s, deviceLimit: plan.limit }))}
                        style={{
                          ...planButton,
                          borderColor: active ? 'var(--h-accent)' : 'var(--h-border)',
                          background: active ? 'var(--h-accentbg)' : 'var(--h-bg)',
                          color: active ? 'var(--h-ink)' : 'var(--h-ink2)'
                        }}
                      >
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 650 }}>{plan.title}</span>
                        <span style={{ display: 'block', marginTop: 4, fontFamily: "'Newsreader', serif", fontSize: 21 }}>{tryLabel(plan.amount)}</span>
                        {plan.limit === 2 ? <span style={{ display: 'block', marginTop: 3, fontSize: 11.5, color: 'var(--h-muted)' }}>toplam</span> : null}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--h-muted)', margin: '9px 0 0' }}>Fiyatlara KDV dahildir.</p>
                <label style={label}>Ad Soyad
                  <input required value={f.name} onChange={set('name')} style={field} placeholder="Ad Soyad" />
                </label>
                <label style={label}>E-posta
                  <input required type="email" value={f.email} onChange={set('email')} style={field} placeholder="ornek@eposta.com" />
                </label>
                <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: 'var(--h-muted)', marginTop: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={f.kvkk} onChange={set('kvkk')} style={{ width: 20, height: 20, flex: 'none', marginTop: 1 }} />
                  <span>Kişisel verilerimin <a href="/yasal/kvkk" style={{ color: 'var(--h-accent-text)' }}>KVKK Aydınlatma Metni</a> kapsamında işlenmesini kabul ediyorum.</span>
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
                  <button type="submit" disabled={state === 'sending' || !f.kvkk} style={{ ...btnPri, opacity: (state === 'sending' || !f.kvkk) ? 0.6 : 1 }}>
                    {state === 'sending' ? 'Yönlendiriliyor…' : `${tryLabel(selectedPrice)} · Ödemeye geç`}
                  </button>
                  <button type="button" onClick={close} style={{ background: 'none', border: 'none', color: 'var(--h-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Vazgeç</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
