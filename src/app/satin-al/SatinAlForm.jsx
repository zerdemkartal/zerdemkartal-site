'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './satin-al.module.css';
import { whatsappUrl } from '@/lib/site';

const PLANLAR = {
  1: { planId: 'hermes-1', label: '1 cihaz lisansı', eftPrice: 6000, note: 'Tek kullanıcı · tek cihaz' },
  2: { planId: 'hermes-2', label: '2 cihaz lisansı', eftPrice: 8500, note: 'İkinci cihaz +₺2.500' }
};

const para = (value) => value == null
  ? 'Hesaplanıyor…'
  : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value);

export default function SatinAlForm() {
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [pricing, setPricing] = useState(null);
  const [fiyatHatasi, setFiyatHatasi] = useState('');
  const [sozlesme, setSozlesme] = useState(false);
  const [dijitalTeslim, setDijitalTeslim] = useState(false);
  const [durum, setDurum] = useState('idle');
  const [hata, setHata] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/pay/paytr/pricing', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error('Kartlı ödeme fiyatı şu anda alınamıyor.');
        if (active) setPricing(data);
      })
      .catch(() => {
        if (active) setFiyatHatasi('Kartlı ödeme fiyatı şu anda alınamıyor; EFT/Havale seçeneği kullanılabilir.');
      });
    return () => { active = false; };
  }, []);

  const plan = PLANLAR[deviceLimit];
  const cardPlan = useMemo(
    () => pricing?.plans?.find((item) => item.planId === plan.planId),
    [pricing, plan.planId]
  );
  const kosullarTamam = sozlesme && dijitalTeslim;
  const cardReady = Boolean(pricing?.configured && cardPlan?.cardPrice);

  function sec(device) {
    setDeviceLimit(device);
    setDurum('idle');
    setHata('');
  }

  function kosullariKontrolEt() {
    if (kosullarTamam) return true;
    setDurum('error');
    setHata('Devam etmek için ön bilgilendirme, mesafeli satış ve dijital teslim koşullarını onaylayın.');
    return false;
  }

  function eftBaslat() {
    if (!kosullariKontrolEt()) return;
    const message = `Merhaba, Hermes ${deviceLimit} cihaz lisansını ${para(plan.eftPrice)} EFT/Havale fiyatıyla satın almak istiyorum. Ödeme bilgilerini paylaşabilir misiniz?`;
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
  }

  async function kartBaslat() {
    if (durum === 'sending' || !cardReady || !kosullariKontrolEt()) return;
    setDurum('sending');
    setHata('');
    try {
      const response = await fetch('/api/pay/paytr/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.planId,
          termsAccepted: true,
          termsVersion: pricing.termsVersion
        }),
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.paymentPageUrl) throw new Error('Güvenli ödeme bağlantısı oluşturulamadı.');
      window.location.assign(data.paymentPageUrl);
    } catch (error) {
      setDurum('error');
      setHata(error.message);
    }
  }

  return (
    <section className={styles.sayfa}>
      <div className={styles.arka} aria-hidden="true"><i /><i /><i /></div>

      <header className={styles.giris}>
        <div className={styles.kicker}>HERMES · GÜVENLİ ÖDEME</div>
        <h1>Lisansını ve ödeme yöntemini seç.</h1>
        <p>Hermes bu sayfada kişisel, fatura veya kart bilgisi istemez. Kartlı ödemede bu bilgiler yalnız PayTR’nin güvenli ödeme sayfasına girilir.</p>
        <div className={styles.adimlar} aria-label="Satın alma adımları">
          <span className={styles.aktif}>01 · Lisans</span>
          <span>02 · Ödeme yöntemi</span>
          <span>03 · PayTR veya EFT</span>
          <span>04 · Dijital teslim</span>
        </div>
      </header>

      <div className={styles.duzen}>
        <aside className={styles.ozet}>
          <span className={styles.ozetEtiket}>SEÇİMİNİZ · EFT/HAVALE</span>
          <div className={styles.fiyat} key={deviceLimit}>{para(plan.eftPrice)}</div>
          <h2>{plan.label}</h2>
          <p>{plan.note}</p>
          <ul>
            <li>Tüm Hermes modülleri</li>
            <li>Sınırsız harita ve danışan</li>
            <li>Çıkan güncellemeler dahil</li>
            <li>Windows 10/11 kurulumu</li>
          </ul>
          <div className={styles.guvence}>
            <strong>Tek seferlik cihaz lisansı</strong>
            <span>Fiyatlara KDV dahildir. Her lisans yalnız seçtiğin bir cihazda geçerlidir; farklı cihaz ayrı lisans gerektirir.</span>
          </div>
        </aside>

        <div className={styles.panel}>
          <div className={styles.panelBas}>
            <div><span>SATIN ALMA</span><h2>Ödeme yolunu seçin</h2></div>
            <small>Uygulama katmanında kişisel veri tutulmaz</small>
          </div>

          <fieldset className={styles.planlar}>
            <legend>Lisans seçimi</legend>
            {Object.entries(PLANLAR).map(([key, secenek]) => {
              const limit = Number(key);
              const aktif = deviceLimit === limit;
              return (
                <button key={key} type="button" aria-pressed={aktif}
                  className={aktif ? styles.planAktif : styles.plan}
                  onClick={() => sec(limit)}>
                  <span><b>{secenek.label}</b><small>{secenek.note}</small></span>
                  <strong>{para(secenek.eftPrice)}</strong>
                </button>
              );
            })}
          </fieldset>

          <div className={styles.odemeler}>
            <article className={styles.odemeKart}>
              <div className={styles.odemeBas}><span>EFT / HAVALE</span><em>En avantajlı</em></div>
              <strong className={styles.odemeFiyat}>{para(plan.eftPrice)}</strong>
              <p>Banka bilgilerini WhatsApp üzerinden alın. Bu temas, Hermes’in Vercel ödeme akışının dışında gerçekleşir.</p>
              <button type="button" className={styles.ikincilButon} onClick={eftBaslat}>EFT/Havale bilgilerini iste</button>
            </article>

            <article className={`${styles.odemeKart} ${styles.kartli}`}>
              <div className={styles.odemeBas}><span>KREDİ / BANKA KARTI</span><em>PayTR güvencesi</em></div>
              <strong className={styles.odemeFiyat}>{cardReady ? para(cardPlan.cardPrice) : '—'}</strong>
              <p>Tek çekim fiyatı PayTR’nin güncel mağaza oranından otomatik hesaplanır. Taksit seçildiğinde toplam tutar PayTR ekranında kartınıza göre değişebilir.</p>
              <button type="button" onClick={kartBaslat} disabled={!cardReady || durum === 'sending'}>
                {durum === 'sending' ? 'PayTR’ye yönlendiriliyor…' : cardReady ? 'PayTR ile güvenli öde' : 'Kartlı ödeme yapılandırılıyor'}
              </button>
            </article>
          </div>

          {fiyatHatasi && <div className={styles.bilgi} role="status">{fiyatHatasi}</div>}

          <div className={styles.gizlilik}>
            <span aria-hidden="true">⌁</span>
            <p><strong>Veri minimizasyonu:</strong> Hermes/Vercel ödeme akışı yalnız seçilen planı, fiyatı ve anonim PayTR işlem referansını işler. Ad, e-posta, telefon, adres, TCKN/VKN ve kart verisi bu akışta alınmaz veya saklanmaz.</p>
          </div>

          <div className={styles.kosullar}>
            <label>
              <input type="checkbox" checked={sozlesme} onChange={(event) => setSozlesme(event.target.checked)} />
              <span><a href="/yasal/on-bilgilendirme" target="_blank">Ön Bilgilendirme Formu</a>nu ve <a href="/yasal/mesafeli-satis" target="_blank">Mesafeli Satış Sözleşmesi</a>ni okudum, kabul ediyorum.</span>
            </label>
            <label>
              <input type="checkbox" checked={dijitalTeslim} onChange={(event) => setDijitalTeslim(event.target.checked)} />
              <span>Ödeme sonrası dijital teslimin başlamasını talep ediyorum; <a href="/yasal/teslimat" target="_blank">teslimat koşulları</a>nı ve lisans/indirme erişimi tesliminden sonra cayma hakkı istisnasını kabul ediyorum.</span>
            </label>
          </div>

          {durum === 'error' && <div className={styles.hata} role="alert">{hata}</div>}
          <p className={styles.dipnot}>Kart ödemesi PayTR sayfasında tamamlanır. Kart bilgileri Hermes sunucularından geçmez.</p>
        </div>
      </div>
    </section>
  );
}
