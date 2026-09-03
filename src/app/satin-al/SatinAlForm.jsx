'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './satin-al.module.css';
import { whatsappUrl } from '@/lib/site';
import { invoiceValidationIssue, normalizeInvoiceData } from '@/lib/purchase-invoice.mjs';
import {
  LICENSE_DEVICE_PRICES,
  LICENSE_SECOND_DEVICE_PRICE,
  PURCHASE_TERMS_VERSION,
  licensePlanNameFor
} from '@/lib/licensePricing';

const PLANLAR = {
  1: { planId: 'hermes-1', label: '1 cihaz lisansı', eftPrice: LICENSE_DEVICE_PRICES[1], note: 'Tek kullanıcı · tek cihaz' },
  2: { planId: 'hermes-2', label: '2 cihaz lisansı', eftPrice: LICENSE_DEVICE_PRICES[2], note: `İkinci cihaz +₺${LICENSE_SECOND_DEVICE_PRICE.toLocaleString('tr-TR')}` }
};

const para = (value) => value == null
  ? 'Hesaplanıyor…'
  : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value);

export default function SatinAlForm() {
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [pricing, setPricing] = useState(null);
  const [fiyatHatasi, setFiyatHatasi] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [emailTekrar, setEmailTekrar] = useState('');
  const [phone, setPhone] = useState('');
  const [invoiceType, setInvoiceType] = useState('individual');
  const [companyTitle, setCompanyTitle] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingDistrict, setBillingDistrict] = useState('');
  const [billingCity, setBillingCity] = useState('');
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
  const temizAd = adSoyad.trim().replace(/\s+/g, ' ');
  const temizEmail = email.trim().toLowerCase();
  const teslimatTamam = temizAd.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(temizEmail) &&
    temizEmail === emailTekrar.trim().toLowerCase();
  const invoiceInput = {
    phone, invoiceType, companyTitle, taxNumber, taxOffice,
    billingAddress, billingDistrict, billingCity
  };
  const invoice = normalizeInvoiceData(invoiceInput);
  const invoiceIssue = invoiceValidationIssue(invoiceInput);
  const cardReady = Boolean(pricing?.configured && cardPlan?.cardPrice);
  const paytrProductName = licensePlanNameFor(deviceLimit);
  const maxInstallment = Number(pricing?.maxInstallment) || 1;
  const taksitOzeti = !pricing
    ? 'Yükleniyor…'
    : !pricing.configured
      ? 'Kartlı ödeme şu anda kullanılamıyor'
      : maxInstallment > 1
        ? `Kartın uygunsa en fazla ${maxInstallment} taksit`
        : 'Yalnız tek çekim';

  function sec(device) {
    setDeviceLimit(device);
    setDurum('idle');
    setHata('');
  }

  function kosullariKontrolEt() {
    if (!teslimatTamam) {
      setDurum('error');
      setHata('İndirme bağlantısını gönderebilmemiz için ad-soyadını ve eşleşen e-posta adreslerini eksiksiz yaz.');
      return false;
    }
    if (invoiceIssue) {
      setDurum('error');
      setHata(invoiceIssue.message);
      return false;
    }
    if (kosullarTamam) return true;
    setDurum('error');
    setHata('Devam etmek için ön bilgilendirme, mesafeli satış ve dijital teslim koşullarını onaylayın.');
    return false;
  }

  async function eftBaslat() {
    if (durum === 'sending' || !kosullariKontrolEt()) return;
    const message = `Merhaba, ben ${temizAd}. Hermes ${deviceLimit} cihaz lisansını ${para(plan.eftPrice)} EFT/Havale fiyatıyla satın almak istiyorum. Teslim e-postam: ${temizEmail}. Fatura ve iletişim bilgilerimi güvenli satın alma formundan ilettim. Ödeme bilgilerini paylaşabilir misiniz?`;
    const whatsapp = window.open('about:blank', '_blank');
    if (whatsapp) whatsapp.opener = null;
    setDurum('sending');
    setHata('');
    try {
      const response = await fetch('/api/purchase-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.planId,
          adSoyad: temizAd,
          email: temizEmail,
          ...invoice,
          termsAccepted: true,
          termsVersion: pricing?.termsVersion || PURCHASE_TERMS_VERSION
        }),
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('EFT/Havale talebi kaydedilemedi. Lütfen tekrar deneyin.');
      const url = whatsappUrl(message);
      if (whatsapp) whatsapp.location.replace(url);
      else window.location.assign(url);
      setDurum('idle');
    } catch (error) {
      if (whatsapp) whatsapp.close();
      setDurum('error');
      setHata(error.message);
    }
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
          adSoyad: temizAd,
          email: temizEmail,
          ...invoice,
          requestId: globalThis.crypto.randomUUID(),
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
        <p>Teslimat, iletişim ve fatura bilgilerini ödeme öncesinde bir kez doldurursun. Kart bilgileri yalnız PayTR’nin güvenli ödeme sayfasına girilir.</p>
        <div className={styles.adimlar} aria-label="Satın alma adımları">
          <span className={styles.aktif}>01 · Lisans</span>
          <span>02 · Ödeme yöntemi</span>
          <span>03 · Fatura bilgileri</span>
          <span>04 · PayTR veya EFT</span>
          <span>05 · Dijital teslim</span>
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
            <small>Teslim ve fatura bilgileri ödeme öncesinde alınır</small>
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

          <section className={styles.teslimat} aria-labelledby="teslimat-bilgileri-baslik">
            <div className={styles.teslimatBas}>
              <div><span>DİJİTAL TESLİM</span><strong id="teslimat-bilgileri-baslik">İndirme bağlantısı nereye gönderilsin?</strong></div>
              <small>Ödeme onayından sonra otomatik gönderilir</small>
            </div>
            <div className={styles.teslimatAlanlari}>
              <label>Ad soyad
                <input value={adSoyad} onChange={(event) => setAdSoyad(event.target.value)} minLength={2} maxLength={120} autoComplete="name" placeholder="Adınız ve soyadınız" required />
              </label>
              <label>E-posta
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" inputMode="email" placeholder="ornek@eposta.com" required />
              </label>
              <label>E-postayı doğrula
                <input type="email" value={emailTekrar} onChange={(event) => setEmailTekrar(event.target.value)} maxLength={254} autoComplete="off" inputMode="email" placeholder="E-posta adresinizi tekrar yazın" required />
              </label>
            </div>
            <p>Bu bilgiler PayTR işlem referansını sana gönderilecek 6 saatlik kişisel indirme davetiyle eşleştirmek için kullanılır.</p>
          </section>

          <section className={styles.fatura} aria-labelledby="fatura-bilgileri-baslik">
            <div className={styles.teslimatBas}>
              <div><span>FATURA VE İLETİŞİM</span><strong id="fatura-bilgileri-baslik">Fatura kimin adına düzenlensin?</strong></div>
              <small>Başarılı ödemede yöneticilere iletilir</small>
            </div>
            <fieldset className={styles.faturaTuru}>
              <legend>Fatura türü</legend>
              <label className={invoiceType === 'individual' ? styles.faturaTuruAktif : undefined}>
                <input type="radio" name="invoiceType" value="individual" checked={invoiceType === 'individual'} onChange={() => setInvoiceType('individual')} />
                <span><strong>Bireysel</strong><small>Ad-soyad ve T.C. kimlik numarası</small></span>
              </label>
              <label className={invoiceType === 'corporate' ? styles.faturaTuruAktif : undefined}>
                <input type="radio" name="invoiceType" value="corporate" checked={invoiceType === 'corporate'} onChange={() => setInvoiceType('corporate')} />
                <span><strong>Kurumsal</strong><small>Unvan, VKN ve vergi dairesi</small></span>
              </label>
            </fieldset>
            <div className={styles.faturaAlanlari}>
              <label>Cep telefonu
                <input name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={24} autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" required />
              </label>
              {invoiceType === 'corporate' && <label className={styles.tamAlan}>Ticari unvan
                <input name="companyTitle" value={companyTitle} onChange={(event) => setCompanyTitle(event.target.value)} minLength={2} maxLength={200} autoComplete="organization" placeholder="Şirketin ticari unvanı" required />
              </label>}
              <label>{invoiceType === 'corporate' ? 'Vergi kimlik numarası' : 'T.C. kimlik numarası'}
                <input name="taxNumber" value={taxNumber} onChange={(event) => setTaxNumber(event.target.value.replace(/\D/g, ''))} minLength={invoiceType === 'corporate' ? 10 : 11} maxLength={invoiceType === 'corporate' ? 10 : 11} inputMode="numeric" autoComplete="off" placeholder={invoiceType === 'corporate' ? '10 haneli VKN' : '11 haneli TCKN'} required />
              </label>
              {invoiceType === 'corporate' && <label>Vergi dairesi
                <input name="taxOffice" value={taxOffice} onChange={(event) => setTaxOffice(event.target.value)} minLength={2} maxLength={120} placeholder="Vergi dairesi" required />
              </label>}
              <label className={styles.tamAlan}>Fatura adresi
                <textarea name="billingAddress" value={billingAddress} onChange={(event) => setBillingAddress(event.target.value)} minLength={10} maxLength={500} autoComplete="street-address" placeholder="Mahalle, cadde/sokak, bina ve daire bilgisi" rows={3} required />
              </label>
              <label>İlçe
                <input name="billingDistrict" value={billingDistrict} onChange={(event) => setBillingDistrict(event.target.value)} minLength={2} maxLength={120} autoComplete="address-level2" placeholder="İlçe" required />
              </label>
              <label>İl
                <input name="billingCity" value={billingCity} onChange={(event) => setBillingCity(event.target.value)} minLength={2} maxLength={120} autoComplete="address-level1" placeholder="İl" required />
              </label>
            </div>
            <p>Bu bilgiler yalnız fatura düzenleme, satın alma kaydı ve gerektiğinde sizinle iletişim kurma amacıyla kullanılır. Kart numarası ve CVV Hermes sunucularına gelmez.</p>
          </section>

          <div className={styles.odemeler}>
            <article className={styles.odemeKart}>
              <div className={styles.odemeBas}><span>EFT / HAVALE</span><em>En avantajlı</em></div>
              <strong className={styles.odemeFiyat}>{para(plan.eftPrice)}</strong>
              <p>Banka bilgilerini WhatsApp üzerinden alın. Bu temas, Hermes’in Vercel ödeme akışının dışında gerçekleşir.</p>
              <button type="button" className={styles.ikincilButon} onClick={eftBaslat} disabled={durum === 'sending'}>{durum === 'sending' ? 'Bilgiler kaydediliyor…' : 'EFT/Havale bilgilerini iste'}</button>
            </article>

            <article className={`${styles.odemeKart} ${styles.kartli}`}>
              <div className={styles.odemeBas}><span>KREDİ / BANKA KARTI</span><em>PayTR güvencesi</em></div>
              <strong className={styles.odemeFiyat}>{cardReady ? para(cardPlan.cardPrice) : '—'}</strong>
              <div className={styles.paytrOnizleme} aria-label="PayTR ödeme ekranı özeti">
                <span>PAYTR EKRANINDA GÖRECEĞİN</span>
                <strong>{paytrProductName}</strong>
                <dl>
                  <div><dt>Tek çekim tutarı</dt><dd>{cardReady ? para(cardPlan.cardPrice) : 'Hesaplanıyor…'}</dd></div>
                  <div><dt>Taksit</dt><dd>{taksitOzeti}</dd></div>
                </dl>
              </div>
              <p>PayTR sayfasında ürün adı, tek çekim tutarı ve kartına açık taksit seçenekleri gösterilir. Taksitli toplam kart ve vadeye göre değişebilir; onaylamadan önce nihai tutarı PayTR’de görürsün.</p>
              <button type="button" onClick={kartBaslat} disabled={!cardReady || durum === 'sending'}>
                {durum === 'sending' ? 'PayTR’ye yönlendiriliyor…' : cardReady ? 'PayTR güvenli ödeme ekranına geç' : 'Kartlı ödeme yapılandırılıyor'}
              </button>
            </article>
          </div>

          {fiyatHatasi && <div className={styles.bilgi} role="status">{fiyatHatasi}</div>}

          <div className={styles.gizlilik}>
            <span aria-hidden="true">⌁</span>
            <p><strong>Güvenli veri kapsamı:</strong> Hermes/Vercel teslimat ve fatura için ad-soyad, e-posta, telefon ve seçtiğin fatura bilgilerini işler. Kart numarası, son kullanma tarihi ve CVV yalnız PayTR sayfasına girilir; Hermes sunucularına alınmaz.</p>
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
          <p className={styles.dipnot}>Kart ödemesi PayTR sayfasında tamamlanır. Başarılı ödemeden sonra kişisel indirme bağlantın e-postana otomatik gönderilir.</p>
        </div>
      </div>
    </section>
  );
}
