'use client';

import { useMemo, useState } from 'react';
import styles from './satin-al.module.css';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY } from '@/lib/site';

const PLANLAR = {
  1: { label: '1 cihaz lisansı', price: 6000, note: 'Tek kullanıcı · tek cihaz' },
  2: { label: '2 cihaz lisansı', price: 8500, note: 'İkinci cihaz +₺2.500' }
};

const para = (value) => `₺${Number(value).toLocaleString('tr-TR')}`;

export default function SatinAlForm() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    deviceLimit: 1,
    kvkk: false,
    website: ''
  });
  const [durum, setDurum] = useState('idle');
  const [hata, setHata] = useState('');
  const plan = useMemo(() => PLANLAR[form.deviceLimit], [form.deviceLimit]);

  const alan = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((onceki) => ({ ...onceki, [key]: value }));
  };

  async function gonder(event) {
    event.preventDefault();
    if (!form.kvkk || durum === 'sending') return;
    setDurum('sending');
    setHata('');
    try {
      const response = await fetch('/api/purchase-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Talebiniz gönderilemedi.');
      setDurum('done');
    } catch (error) {
      setHata(error.message);
      setDurum('error');
    }
  }

  if (durum === 'done') {
    return (
      <section className={styles.basari} aria-live="polite">
        <div className={styles.basariHalka} aria-hidden="true"><span>✓</span></div>
        <div className={styles.kicker}>TALEBİNİZ ALINDI</div>
        <h1>Hermes’e bir adım kaldı.</h1>
        <p>
          Teşekkürler {form.firstName}. Satın alma talebiniz Posta Merkezi’ne ulaştı.
          Ödeme ve lisans teslimi için ekibimize <strong>{CONTACT_EMAIL}</strong> veya
          WhatsApp üzerinden <strong>{WHATSAPP_DISPLAY}</strong> adreslerinden ulaşabilirsiniz.
        </p>
        <div className={styles.basariOzet}>
          <span>{plan.label}</span>
          <strong>{para(plan.price)}</strong>
          <small>KDV dahil · abonelik yok</small>
        </div>
        <a href="/" className={styles.ikincil}>Ana sayfaya dön</a>
      </section>
    );
  }

  return (
    <section className={styles.sayfa}>
      <div className={styles.arka} aria-hidden="true">
        <i /><i /><i />
      </div>

      <header className={styles.giris}>
        <div className={styles.kicker}>HERMES · ÖN SATIŞ</div>
        <h1>Atölyen için lisansını seç.</h1>
        <p>Bilgilerinizi iletin; ödeme bağlantısı ve lisans adımları e-posta veya WhatsApp üzerinden size ulaştırılsın.</p>
        <div className={styles.adimlar} aria-label="Satın alma adımları">
          <span className={styles.aktif}>01 · Lisans</span>
          <span>02 · Bilgiler</span>
          <span>03 · Güvenli dönüş</span>
        </div>
      </header>

      <div className={styles.duzen}>
        <aside className={styles.ozet}>
          <span className={styles.ozetEtiket}>SEÇİMİNİZ</span>
          <div className={styles.fiyat} key={form.deviceLimit}>{para(plan.price)}</div>
          <h2>{plan.label}</h2>
          <p>{plan.note}</p>
          <ul>
            <li>Tüm Hermes modülleri</li>
            <li>Sınırsız harita ve danışan</li>
            <li>Çıkan güncellemeler dahil</li>
            <li>Windows 10/11 kurulumu</li>
          </ul>
          <div className={styles.guvence}>
            <strong>Tek seferlik lisans</strong>
            <span>Fiyatlara KDV dahildir. Abonelik veya gizli ücret yoktur.</span>
          </div>
        </aside>

        <form className={styles.form} onSubmit={gonder}>
          <div className={styles.formBas}>
            <div>
              <span>SATIN ALMA TALEBİ</span>
              <h2>Size nasıl ulaşalım?</h2>
            </div>
            <small>Bu adımda ödeme alınmaz.</small>
          </div>

          <fieldset className={styles.planlar}>
            <legend>Lisans seçimi</legend>
            {Object.entries(PLANLAR).map(([key, secenek]) => {
              const limit = Number(key);
              const aktif = form.deviceLimit === limit;
              return (
                <button key={key} type="button" aria-pressed={aktif}
                  className={aktif ? styles.planAktif : styles.plan}
                  onClick={() => setForm((onceki) => ({ ...onceki, deviceLimit: limit }))}>
                  <span><b>{secenek.label}</b><small>{secenek.note}</small></span>
                  <strong>{para(secenek.price)}</strong>
                </button>
              );
            })}
          </fieldset>

          <div className={styles.alanlar}>
            <label>İsim
              <input required minLength={2} maxLength={60} autoComplete="given-name"
                value={form.firstName} onChange={alan('firstName')} placeholder="İsminiz" />
            </label>
            <label>Soyisim
              <input required minLength={2} maxLength={60} autoComplete="family-name"
                value={form.lastName} onChange={alan('lastName')} placeholder="Soyisminiz" />
            </label>
            <label>E-posta
              <input required type="email" autoComplete="email"
                value={form.email} onChange={alan('email')} placeholder="ornek@eposta.com" />
            </label>
            <label>Telefon
              <input required type="tel" autoComplete="tel" inputMode="tel"
                value={form.phone} onChange={alan('phone')} placeholder="+90 5xx xxx xx xx" />
            </label>
          </div>

          <label className={styles.tuzak} aria-hidden="true">Web sitesi
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={alan('website')} />
          </label>

          <label className={styles.kvkk}>
            <input required type="checkbox" checked={form.kvkk} onChange={alan('kvkk')} />
            <span>Kişisel verilerimin <a href="/yasal/kvkk" target="_blank">KVKK Aydınlatma Metni</a> kapsamında işlenmesini kabul ediyorum.</span>
          </label>

          {durum === 'error' && <div className={styles.hata} role="alert">{hata}</div>}

          <div className={styles.alt}>
            <div><span>Talep toplamı</span><strong>{para(plan.price)}</strong></div>
            <button type="submit" disabled={!form.kvkk || durum === 'sending'}>
              {durum === 'sending' ? 'Gönderiliyor…' : 'Satın alma talebini gönder'}
            </button>
          </div>
          <p className={styles.dipnot}>Talep gönderildikten sonra ödeme ve teslim ayrıntıları ekibimiz tarafından doğrulanır.</p>
        </form>
      </div>
    </section>
  );
}
