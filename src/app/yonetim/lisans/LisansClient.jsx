'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './lisans.module.css';

const TOKEN_KEY = 'h_license_jwt';
const FEATURES = ['dereceler', 'esmalar', 'analizler', 'ogretmen', 'egitim'];
const LEVELS = ['temel', 'tam', 'pro', 'yonetici'];
const ADMIN_ROLES = ['lisans_yoneticisi', 'destek', 'denetci'];
const ERROR_TEXT = {
  'google-girisi-hazir-degil': 'Google girişi henüz yapılandırılmamış.',
  'google-girisi-dogrulanamadi': 'Google hesabı doğrulanamadı.',
  'google-hesabi-yetkisiz': 'Bu Google hesabının lisans yönetimi yetkisi yok.',
  'google-oturumu-gecersiz': 'Google doğrulamasının süresi doldu. Yeniden Google ile giriş yap.',
  'mfa-dogrulanamadi': 'Authenticator kodu doğrulanamadı.',
  'yeniden-dogrulama-basarisiz': 'Authenticator kodu doğrulanamadı.',
  'e-posta-gonderilemedi': 'Ödeme kaydedildi ancak e-posta gönderilemedi. Ayarları kontrol edip aynı düğmeyle yeniden dene.',
  'indirme-daveti-kilitli': 'İndirme daveti geçici olarak kilitli.',
  'siparis-silinemez-bagli-kayit': 'Ödeme, davet veya lisans bağlantısı bulunan sipariş kalıcı silinemez.',
  'siparis-bulunamadi': 'Sipariş bulunamadı veya daha önce silindi.',
  'iptal-edilmis-siparis': 'İptal edilmiş sipariş için ödeme onaylanamaz.',
  forbidden: 'Bu işlem için yetkin veya son yeniden doğrulaman geçerli değil.',
  'gecersiz-istek': 'Giriş bilgileri geçerli biçimde gönderilemedi.'
};

function errorText(value) {
  return ERROR_TEXT[value] || value || 'Geçici bir hata oluştu.';
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function formatMoney(kurus, currency = 'TRY') {
  const normalizedCurrency = currency === 'TL' ? 'TRY' : currency;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: normalizedCurrency || 'TRY',
    minimumFractionDigits: 2
  }).format(Number(kurus || 0) / 100);
}

function deliveryText(checkout) {
  if (!checkout) return 'Eski/test kayıt · otomatik teslim yok';
  if (checkout.deliveryStatus === 'sent') return `İndirme daveti gönderildi · ${formatDate(checkout.deliverySentAt)}`;
  if (checkout.deliveryStatus === 'failed') return `Teslimat bekliyor · ${checkout.deliveryAttempts} deneme`;
  if (checkout.deliveryStatus === 'sending') return 'İndirme daveti gönderiliyor';
  return 'İndirme daveti bekliyor';
}

function salesNotificationText(checkout) {
  if (!checkout) return 'Yönetici satış bildirimi yok';
  if (checkout.salesNotificationStatus === 'sent') return `Yönetici bildirimi gönderildi · ${formatDate(checkout.salesNotificationSentAt)}`;
  if (checkout.salesNotificationStatus === 'failed') return `Yönetici bildirimi bekliyor · ${checkout.salesNotificationAttempts} deneme`;
  if (checkout.salesNotificationStatus === 'sending') return 'Yönetici bildirimi gönderiliyor';
  return 'Yönetici bildirimi bekliyor';
}

function requestId() {
  return globalThis.crypto.randomUUID();
}

function normalizeSearch(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ı', 'i');
}

async function api(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    cache: 'no-store',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'gecici-hata'), { status: response.status });
  return data;
}

function Status({ value, monitoring }) {
  return (
    <span className={`${styles.durum} ${styles[`durum_${value}`] || ''}`}>
      {value.replaceAll('_', ' ')}{monitoring ? ' · izleme' : ''}
    </span>
  );
}

export default function LisansClient({ mode = 'licenses' }) {
  const isPayments = mode === 'payments';
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  const [kod, setKod] = useState('');
  const [kurtarmaKodu, setKurtarmaKodu] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const [googleChallenge, setGoogleChallenge] = useState('');
  const [rows, setRows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [downloadInvites, setDownloadInvites] = useState([]);
  const [paytrReceipts, setPaytrReceipts] = useState([]);
  const [orderRefs, setOrderRefs] = useState({});
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [filter, setFilter] = useState('hermes');
  const [search, setSearch] = useState('');
  const [selectedNo, setSelectedNo] = useState('');
  const [history, setHistory] = useState([]);
  const [reason, setReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [confirmNo, setConfirmNo] = useState('');
  const [remoteLevel, setRemoteLevel] = useState('temel');
  const [remoteFeatures, setRemoteFeatures] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminDrafts, setAdminDrafts] = useState({});
  const [adminReason, setAdminReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [desktopPairing, setDesktopPairing] = useState(null);
  const [desktopPairingStatus, setDesktopPairingStatus] = useState('');
  const googleButtonRef = useRef(null);

  const selected = useMemo(
    () => rows.find((row) => row.licenseNo === selectedNo) || null,
    [rows, selectedNo]
  );
  const matchingRows = useMemo(() => {
    const query = normalizeSearch(search.trim());
    if (!query) return rows;
    return rows.filter((row) => normalizeSearch([
      row.licenseNo,
      row.customerRef,
      row.customerEmail,
      row.application,
      row.signedLevel,
      ...(row.aliases || []).map((alias) => alias.licenseNo)
    ].filter(Boolean).join(' ')).includes(query));
  }, [rows, search]);
  const visible = useMemo(
    () => matchingRows.filter((row) => filter === 'tumu' || row.application === filter),
    [matchingRows, filter]
  );

  const clearNotice = () => { setError(''); setMessage(''); };
  const saveToken = (value) => {
    try {
      if (value) sessionStorage.setItem(TOKEN_KEY, value);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken(value || '');
  };

  const loadOrders = useCallback(async (activeToken = token) => {
    if (!activeToken) return;
    try {
      const data = await api('/api/lisans/v1/yonetim/siparisler', { token: activeToken });
      setRole(data.rol || '');
      setOrders(data.siparisler || []);
      setDownloadInvites(data.davetler || []);
      setPaytrReceipts(data.paytrMakbuzlari || []);
    } catch (err) {
      if (err.status === 401) saveToken('');
      setError(errorText(err.message));
    }
  }, [token]);

  const loadRows = useCallback(async (activeToken = token) => {
    if (!activeToken) return;
    try {
      const data = await api('/api/lisans/v1/yonetim/liste', { token: activeToken });
      setRows(data.lisanslar || []);
      setRole(data.rol || '');
      setSelectedNo((current) => current || data.lisanslar?.[0]?.licenseNo || '');
      setError('');
    } catch (err) {
      if (err.status === 401 || err.status === 403) saveToken('');
      setError(errorText(err.message));
    }
  }, [token, loadOrders]);

  useEffect(() => {
    try {
      const id = new URLSearchParams(globalThis.location.search).get('masaustu') || '';
      let secret = '';
      if (globalThis.location.hash.startsWith('#s=')) secret = decodeURIComponent(globalThis.location.hash.slice(3));
      if (id && secret) {
        setDesktopPairing({ eslestirmeId: id, eslestirmeSirri: secret });
        globalThis.history.replaceState({}, '', `/yonetim/lisans?masaustu=${encodeURIComponent(id)}`);
      }
    } catch {}
    let current = '';
    try { current = sessionStorage.getItem(TOKEN_KEY) || ''; } catch {}
    if (current) { setToken(current); (isPayments ? loadOrders(current) : loadRows(current)); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleCredential = useCallback(async (response) => {
    setError(''); setMessage(''); setBusy(true);
    try {
      const data = await api('/api/lisans/v1/yonetim/oturum/google-baslat', {
        method: 'POST', body: { credential: response?.credential || '' }
      });
      setGoogleChallenge(data.challenge);
      setKod(''); setKurtarmaKodu('');
      setMessage('Google hesabın doğrulandı. Şimdi Authenticator kodunu gir.');
    } catch (err) { setError(errorText(err.message)); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (token) return;
    let cancelled = false;
    api('/api/lisans/v1/yonetim/oturum/google-yapilandirma')
      .then((data) => { if (!cancelled) setGoogleClientId(data.clientId || ''); })
      .catch((err) => { if (!cancelled) setError(errorText(err.message)); });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!googleClientId || token || googleChallenge) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !globalThis.google?.accounts?.id || !googleButtonRef.current) return;
      globalThis.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      googleButtonRef.current.replaceChildren();
      globalThis.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: Math.min(420, googleButtonRef.current.clientWidth || 420),
        locale: 'tr'
      });
      setGoogleReady(true);
    };
    const existing = document.getElementById('hermes-google-identity');
    if (existing) {
      if (globalThis.google?.accounts?.id) render();
      else existing.addEventListener('load', render, { once: true });
    } else {
      const script = document.createElement('script');
      script.id = 'hermes-google-identity';
      script.src = 'https://accounts.google.com/gsi/client?hl=tr';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', render, { once: true });
      script.addEventListener('error', () => !cancelled && setError('Google giriş bileşeni yüklenemedi.'));
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [googleClientId, googleChallenge, handleGoogleCredential, token]);

  useEffect(() => {
    if (!selected) return;
    setRemoteLevel(selected.remoteLevel);
    setRemoteFeatures(Array.isArray(selected.remoteFeatures) ? selected.remoteFeatures.filter((feature) => FEATURES.includes(feature)) : []);
    setHistory([]);
    setReason('');
    setConfirmNo('');
  }, [selectedNo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function verifyGoogleMfa(event) {
    event.preventDefault();
    clearNotice(); setBusy(true);
    try {
      const data = await api('/api/lisans/v1/yonetim/oturum/google-dogrula', {
        method: 'POST',
        body: { challenge: googleChallenge, ...(kurtarmaKodu ? { kurtarmaKodu } : { kod }) }
      });
      saveToken(data.token); setRole(data.role); setGoogleChallenge(''); setKod(''); setKurtarmaKodu('');
      await (isPayments ? loadOrders(data.token) : loadRows(data.token));
    } catch (err) {
      setError(errorText(err.message));
    } finally { setBusy(false); }
  }

  function resetGoogleLogin() {
    try { globalThis.google?.accounts?.id?.disableAutoSelect(); } catch {}
    setGoogleChallenge(''); setGoogleReady(false); setKod(''); setKurtarmaKodu(''); clearNotice();
  }

  async function logout() {
    try { await api('/api/lisans/v1/yonetim/oturum/cikis', { token, method: 'POST' }); } catch {}
    saveToken(''); setRows([]); setOrders([]); setDownloadInvites([]); setPaytrReceipts([]); setOrderRefs({}); setSelectedNo(''); setRole(''); setAdminUsers([]); setAdminDrafts({});
  }

  async function copyPaytrReference(merchantOid) {
    clearNotice();
    try {
      await navigator.clipboard.writeText(merchantOid);
      setMessage('PayTR ödeme referansı kopyalandı. PayTR mağaza panelindeki işlemle eşleştirebilirsin.');
    } catch {
      setError('Ödeme referansı kopyalanamadı. Referansı seçip elle kopyalayabilirsin.');
    }
  }

  async function retryPaytrNotification(checkoutId) {
    clearNotice(); setBusy(true);
    try {
      await api('/api/lisans/v1/yonetim/paytr-bildirimi', {
        token,
        method: 'POST',
        body: {
          checkoutId,
          gerekce: 'Başarılı PayTR ödemesinin eksik teslimat veya yönetici bildirimi yeniden denendi.',
          istekId: requestId()
        }
      });
      await loadOrders();
      setMessage('PayTR teslimatı ve yönetici satış bildirimi kontrol edildi; eksik olan posta güvenli biçimde yeniden denendi.');
    } catch (err) {
      setError(err.status === 403
        ? 'Bildirimi yeniden denemeden önce aşağıdaki Authenticator alanından 10 dakikalık yeniden doğrulama yap.'
        : errorText(err.message));
      await loadOrders();
    } finally { setBusy(false); }
  }

  async function approveDesktopPairing() {
    if (!desktopPairing) return;
    clearNotice(); setBusy(true); setDesktopPairingStatus('');
    try {
      await api('/api/lisans/v1/yonetim/masaustu/onayla', {
        token,
        method: 'POST',
        body: desktopPairing
      });
      setDesktopPairingStatus('Kripto Yönetimi güvenli biçimde bağlandı. Bu tarayıcı sekmesini kapatabilirsin.');
      setDesktopPairing(null);
    } catch (err) {
      setError(errorText(err.message));
    } finally { setBusy(false); }
  }

  async function confirmEft(order) {
    if (!globalThis.confirm(`${order.name} adına ${order.price.toLocaleString('tr-TR')} TL EFT/havale ödemesini banka hesabında gördüğünü onaylıyor musun?`)) return;
    clearNotice(); setBusy(true);
    try {
      await api(`/api/lisans/v1/yonetim/siparisler/${encodeURIComponent(order.id)}/eft-onay`, {
        token,
        method: 'POST',
        body: {
          gerekce: 'EFT/havale ödemesi banka hesabından doğrulandı.',
          ...(orderRefs[order.id]?.trim() ? { odemeReferansi: orderRefs[order.id].trim() } : {}),
          istekId: requestId()
        }
      });
      setOrderRefs((current) => ({ ...current, [order.id]: '' }));
      await loadOrders();
      setMessage('EFT ödemesi onaylandı; teşekkür mesajı, kişisel bağlantı ve 72 saatlik geçici şifre müşteriye e-postalandı.');
    } catch (err) {
      setError(err.status === 403
        ? 'EFT onayından önce aşağıdaki Authenticator alanından 10 dakikalık yeniden doğrulama yap.'
        : errorText(err.message));
      await loadOrders();
    } finally { setBusy(false); }
  }

  async function deletePendingOrder(order) {
    const confirmation = globalThis.prompt(
      `${order.name} adlı bekleyen sipariş kalıcı olarak silinecek. Bu işlem geri alınamaz.\n\nDevam etmek için SİL yaz:`
    );
    if (confirmation !== 'SİL') return;
    clearNotice(); setBusy(true);
    try {
      await api(`/api/lisans/v1/yonetim/siparisler/${encodeURIComponent(order.id)}`, {
        token,
        method: 'DELETE',
        body: {
          onay: 'SİL',
          gerekce: 'Bağlı ödemesi olmayan hatalı veya test bekleyen sipariş kullanıcı talebiyle kalıcı silindi.',
          istekId: requestId()
        }
      });
      await loadOrders();
      setMessage('Bekleyen sipariş kalıcı olarak silindi; denetim kaydı korundu.');
    } catch (err) {
      setError(err.status === 403
        ? 'Kalıcı silmeden önce aşağıdaki Authenticator alanından 10 dakikalık yeniden doğrulama yap.'
        : errorText(err.message));
      await loadOrders();
    } finally { setBusy(false); }
  }

  async function sendDownloadInvite(event) {
    event.preventDefault();
    clearNotice(); setBusy(true);
    try {
      await api('/api/lisans/v1/yonetim/indirme-daveti', {
        token,
        method: 'POST',
        body: {
          adSoyad: inviteName,
          email: inviteEmail,
          gerekce: 'Site başvurusu olmayan müşteriye kişisel indirme daveti gönderildi.',
          istekId: requestId()
        }
      });
      setInviteName(''); setInviteEmail('');
      await loadOrders();
      setMessage('Kişisel indirme bağlantısı ve 72 saatlik geçici şifre müşteriye e-postalandı.');
    } catch (err) {
      setError(err.status === 403
        ? 'İndirme daveti göndermeden önce bu bölümde Authenticator ile 10 dakikalık yeniden doğrulama yap.'
        : errorText(err.message));
      await loadOrders();
    } finally { setBusy(false); }
  }

  async function loadAdminUsers() {
    clearNotice(); setBusy(true);
    try {
      const data = await api('/api/lisans/v1/yonetim/kullanicilar', { token });
      const users = data.kullanicilar || [];
      setAdminUsers(users);
      setAdminDrafts(Object.fromEntries(users.map((user) => [user.email, {
        rol: user.licenseRole || 'denetci',
        aktif: Boolean(user.licenseActive)
      }])));
    } catch (err) { setError(errorText(err.message)); }
    finally { setBusy(false); }
  }

  function updateAdminDraft(emailAddress, field, value) {
    setAdminDrafts((current) => ({
      ...current,
      [emailAddress]: { ...(current[emailAddress] || {}), [field]: value }
    }));
  }

  async function saveAdminUser(user) {
    const draft = adminDrafts[user.email];
    if (!draft) return;
    clearNotice(); setBusy(true);
    try {
      await api('/api/lisans/v1/yonetim/kullanicilar', {
        token,
        method: 'POST',
        body: {
          email: user.email,
          rol: draft.rol,
          aktif: draft.aktif,
          gerekce: adminReason,
          istekId: requestId()
        }
      });
      setAdminReason('');
      await loadAdminUsers();
      setMessage('Yönetici yetkisi güncellendi; eski lisans oturumları kapatıldı.');
    } catch (err) { setError(errorText(err.message)); }
    finally { setBusy(false); }
  }

  async function action(path, body, success) {
    clearNotice(); setBusy(true);
    try {
      await api(path, { token, method: 'POST', body: { ...body, istekId: requestId() } });
      setMessage(success); await loadRows();
    } catch (err) { setError(errorText(err.message)); }
    finally { setBusy(false); }
  }

  async function loadHistory() {
    if (!selected) return;
    clearNotice(); setBusy(true);
    try {
      const data = await api(`/api/lisans/v1/yonetim/gecmis?lisansNo=${encodeURIComponent(selected.licenseNo)}`, { token });
      setHistory(data.olaylar || []);
    } catch (err) { setError(errorText(err.message)); }
    finally { setBusy(false); }
  }

  async function reauthenticate(event) {
    event.preventDefault(); clearNotice(); setBusy(true);
    try {
      await api('/api/lisans/v1/yonetim/oturum/yeniden-dogrula', {
        token,
        method: 'POST',
        body: { ...(kurtarmaKodu ? { kurtarmaKodu } : { kod }) }
      });
      setKod(''); setKurtarmaKodu(''); setMessage('Kritik işlemler 10 dakika için açıldı.');
    } catch (err) { setError(errorText(err.message)); }
    finally { setBusy(false); }
  }

  const mayStatus = ['sahip', 'lisans_yoneticisi', 'destek'].includes(role);
  const mayTransfer = ['sahip', 'lisans_yoneticisi'].includes(role);
  const mayRights = ['sahip', 'lisans_yoneticisi'].includes(role);
  const mayOrders = ['sahip', 'lisans_yoneticisi'].includes(role);
  const pendingOrders = orders.filter((order) => order.status === 'pending' || !order.paymentEmailSentAt);
  const recentInvites = downloadInvites.slice(0, 12);
  const livePaytrReceipts = paytrReceipts.filter((receipt) => !receipt.testMode);
  const testPaytrReceipts = paytrReceipts.filter((receipt) => receipt.testMode);
  const licenseRequestWaiting = livePaytrReceipts.filter((receipt) => receipt.status === 'paid' && receipt.checkout);
  const signedFeatures = selected && Array.isArray(selected.signedFeatures) ? selected.signedFeatures.filter((feature) => FEATURES.includes(feature)) : [];

  if (!token) {
    return (
      <main className={styles.sayfa}>
        <section className={styles.giris} aria-labelledby="lisans-giris-baslik">
          <a className={styles.geri} href="/yonetim">Yönetim merkezine dön</a>
          <span className={styles.kicker}>LİSANS GÜVENLİĞİ</span>
          <h1 id="lisans-giris-baslik">Kısa ömürlü yönetim oturumu</h1>
          <p>Yalnız sahip Gmail hesabı kabul edilir. Google doğrulamasından sonra Authenticator kodun istenir.</p>
          {error && <div className={styles.hata} role="alert">{error}</div>}
          {message && <div className={styles.bilgi} role="status">{message}</div>}
          {googleChallenge ? (
            <form className={styles.girisForm} onSubmit={verifyGoogleMfa}>
              <label>Google Authenticator kodu<input value={kod} onChange={(e) => setKod(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /></label>
              <label>Kurtarma kodu <small>Yalnız Authenticator’a erişemiyorsan kullan.</small><input value={kurtarmaKodu} onChange={(e) => setKurtarmaKodu(e.target.value.toUpperCase())} autoComplete="off" /></label>
              <button className={styles.birincil} disabled={busy || (!kod && !kurtarmaKodu)}>{busy ? 'Doğrulanıyor…' : 'İkinci güvenliği doğrula'}</button>
              <button type="button" className={styles.ikincil} onClick={resetGoogleLogin} disabled={busy}>Google hesabını değiştir</button>
            </form>
          ) : (
            <div className={styles.googleGiris}>
              <div ref={googleButtonRef} className={styles.googleButon} aria-label="Google ile giriş yap" />
              {!googleReady && !error && <p role="status">Google giriş düğmesi hazırlanıyor…</p>}
              <small>Yalnız bu panele atanmış sahip Gmail hesabı ilerleyebilir.</small>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.sayfa}>
      <div className={styles.kabuk}>
        <header className={styles.ust}>
          <div><span className={styles.kicker}>{isPayments ? 'HERMES · ÖDEME YÖNETİMİ' : 'HERMES · LİSANS YÖNETİMİ'}</span><h1>{isPayments ? 'Ödeme onayı ve indirme' : 'Lisans ve cihaz durumu'}</h1><p>Rol: <strong>{role}</strong>{isPayments ? ' · PayTR ödeme kayıtları, otomatik teslimat, EFT onayı ve kişisel indirme davetleri bu sayfada yönetilir.' : ' · Sunucu yetkisi çevrimdışı imzalı tavanı aşamaz.'}</p></div>
          <div className={styles.ustEylem}><button className={styles.ikincil} onClick={() => isPayments ? loadOrders() : loadRows()} disabled={busy}>Yenile</button><button className={styles.ikincil} onClick={logout}>Çıkış</button></div>
        </header>

        {error && <div className={styles.hata} role="alert">{error}</div>}
        {message && <div className={styles.bilgi} role="status">{message}</div>}
        {desktopPairingStatus && <div className={styles.bilgi} role="status">{desktopPairingStatus}</div>}
        {desktopPairing && <section className={styles.masaustuBagla} aria-labelledby="masaustu-bagla-baslik">
          <div><span className={styles.kicker}>KRİPTO YÖNETİMİ</span><h2 id="masaustu-bagla-baslik">Masaüstü uygulamasını bağla</h2><p>Bu onay, yönetim oturumunu yalnız açık olan Kripto Yönetimi uygulamasına tek kullanımlık olarak devreder.</p></div>
          <button className={styles.birincil} onClick={approveDesktopPairing} disabled={busy}>{busy ? 'Bağlanıyor…' : 'Kripto Yönetimi’ne bağlan'}</button>
        </section>}

        {isPayments && mayOrders && <section className={styles.siparisPanel} aria-labelledby="indirme-yonetici-baslik">
          <div className={styles.siparisBas}>
            <div>
              <span className={styles.kicker}>İNDİRME YÖNETİCİSİ</span>
              <h2 id="indirme-yonetici-baslik">Satın alma ve indirme erişimi</h2>
              <p>EFT ödemesini burada onayla veya siteden başvurmayan müşteriye doğrudan davet gönder. Müşteriye kişisel bağlantı ile 72 saatlik rastgele şifre gider; asıl imzalı lisansı programdaki <strong>Lisans İste</strong> kaydı geldikten sonra Kripto Yönetimi’nden sen verirsin.</p>
            </div>
            <button className={styles.ikincil} onClick={() => loadOrders()} disabled={busy}>Yöneticiyi yenile</button>
          </div>

          <section className={styles.paytrMakbuzlar} aria-labelledby="paytr-makbuz-baslik">
            <div className={styles.altBaslik}>
              <div><span className={styles.kicker}>PAYTR · OTOMATİK TESLİM</span><strong id="paytr-makbuz-baslik">Kart ödemeleri</strong></div>
              <span>Teslimat ve fatura bilgileri burada görünür; kart numarası ve CVV hiçbir zaman tutulmaz.</span>
            </div>
            <p className={styles.paytrAciklama}>Başarılı PayTR bildirimi ödeme kaydını oluşturur, müşteriye 72 saatlik kişisel indirme davetini ve tanımladığın yönetici adreslerine satış özetini otomatik gönderir. Ödenen kayıt burada <strong>programdan Lisans İste bekleniyor</strong> olarak izlenir; makine kimliği geldikten sonraki gerçek lisans talebi Kripto Yönetimi’nin Bekleyenler bölümüne düşer. Aşağıdaki form yalnız istisnai durumlarda elle yeniden davet vermek içindir.</p>
            <div className={styles.paytrOzet} aria-label="PayTR ödeme özeti">
              <article><span>Toplam kayıt</span><strong>{paytrReceipts.length}</strong></article>
              <article><span>Canlı ödeme</span><strong>{livePaytrReceipts.length}</strong></article>
              <article><span>Test kaydı</span><strong>{testPaytrReceipts.length}</strong></article>
              <article><span>Lisans İste beklenen</span><strong>{licenseRequestWaiting.length}</strong></article>
            </div>
            {paytrReceipts.length === 0 ? <p className={styles.siparisBos}>Henüz PayTR kart ödeme bildirimi alınmadı.</p> : <div className={styles.paytrListe}>
              {paytrReceipts.map((receipt) => <article key={receipt.id}>
                <div className={styles.paytrReferans}>
                  <span>PayTR referansı</span>
                  <strong>{receipt.merchantOid}</strong>
                  <button type="button" onClick={() => copyPaytrReference(receipt.merchantOid)}>Referansı kopyala</button>
                  {receipt.checkout && <small>{receipt.checkout.name} · {receipt.checkout.email}</small>}
                </div>
                <div><span>Ödenen tutar</span><strong>{formatMoney(receipt.totalAmountKurus, receipt.currency)}</strong><small>Tek çekim fiyatı {formatMoney(receipt.paymentAmountKurus, receipt.currency)}</small></div>
                <div><span>Plan</span><strong>{receipt.deviceLimit} cihaz</strong><small>{receipt.planId} · EFT hedefi {formatMoney(receipt.netTargetKurus, receipt.currency)}</small></div>
                <div><span>Durum ve teslimat</span><strong>{receipt.testMode ? 'Test' : 'Canlı'} · {receipt.status === 'paid' ? 'Ödendi' : receipt.status}</strong><small>{receipt.paymentType === 'card' ? 'Kart' : receipt.paymentType} · {formatDate(receipt.paidAt)}</small>{!receipt.testMode && receipt.checkout && <small>Ödendi · programdan Lisans İste bekleniyor</small>}<small>{deliveryText(receipt.checkout)}</small><small>{salesNotificationText(receipt.checkout)}</small>{!receipt.testMode && receipt.checkout && (receipt.checkout.deliveryStatus !== 'sent' || receipt.checkout.salesNotificationStatus !== 'sent') && <button type="button" className={styles.ikincil} onClick={() => retryPaytrNotification(receipt.checkout.id)} disabled={busy}>Teslimat ve bildirimi yeniden dene</button>}</div>
                <div className={styles.paytrFatura}>
                  <span>Fatura ve iletişim bilgileri</span>
                  {receipt.checkout?.invoiceType ? <>
                    <strong>{receipt.checkout.invoiceType === 'corporate' ? 'Kurumsal' : 'Bireysel'} · {receipt.checkout.invoiceType === 'corporate' ? receipt.checkout.companyTitle : receipt.checkout.name}</strong>
                    <small>{receipt.checkout.invoiceType === 'corporate' ? 'VKN' : 'TCKN'}: {receipt.checkout.taxNumber}{receipt.checkout.taxOffice ? ` · Vergi dairesi: ${receipt.checkout.taxOffice}` : ''}</small>
                    <small>Telefon: {receipt.checkout.phone}</small>
                    <small>Adres: {receipt.checkout.billingAddress} · {receipt.checkout.billingDistrict} / {receipt.checkout.billingCity}</small>
                  </> : <strong>Bu eski/test kayıtta fatura bilgisi bulunmuyor.</strong>}
                </div>
              </article>)}
            </div>}
          </section>

          <form className={styles.davetForm} onSubmit={sendDownloadInvite}>
            <div className={styles.davetAciklama}>
              <strong>Siteye başvurmayan müşteriye gönder</strong>
              <span>Ad-soyad ve e-posta yeterlidir. Geçici şifre panelde gösterilmez veya saklanmaz; yalnız müşterinin e-postasına gider.</span>
            </div>
            <label>Ad soyad<input value={inviteName} onChange={(event) => setInviteName(event.target.value)} minLength={2} maxLength={120} autoComplete="name" required /></label>
            <label>E-posta<input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} maxLength={254} autoComplete="email" required /></label>
            <button className={styles.ikincil} disabled={busy || inviteName.trim().length < 2 || !inviteEmail.includes('@')}>İndirme linki gönder</button>
          </form>

          <div className={styles.altBaslik}><strong>Ödeme bekleyenler</strong><span>EFT onayı daveti otomatik gönderir.</span></div>
          {pendingOrders.length === 0 ? <p className={styles.siparisBos}>Onay bekleyen EFT siparişi yok.</p> : <div className={styles.siparisListe}>
            {pendingOrders.map((order) => <article key={order.id}>
              <div className={styles.siparisKimlik}>
                <strong>{order.name}</strong>
                <span>{order.email}</span>
                <small>Sipariş {order.id} · {formatDate(order.createdAt)}</small>
              </div>
              <div className={styles.siparisTutar}>
                <strong>{order.price.toLocaleString('tr-TR')} TL</strong>
                <span>{order.product} · {order.deviceLimit} cihaz</span>
                <small>{order.status === 'paid' ? 'Ödeme kayıtlı · güvenli davet bekliyor' : 'Ödeme bekliyor'}</small>
              </div>
              <label>Banka referansı <small>İsteğe bağlı</small>
                <input value={orderRefs[order.id] || ''} maxLength={100} onChange={(event) => setOrderRefs((current) => ({ ...current, [order.id]: event.target.value }))} placeholder="Dekont / işlem no" />
              </label>
              <div className={styles.siparisEylem}>
                <button className={styles.ikincil} disabled={busy} onClick={() => confirmEft(order)}>
                  {order.status === 'paid' ? 'Güvenli daveti gönder' : 'EFT ödemesi alındı'}
                </button>
                {role === 'sahip' && order.status === 'pending' && <button className={styles.silButon} disabled={busy} onClick={() => deletePendingOrder(order)}>Kalıcı sil</button>}
              </div>
            </article>)}
          </div>}

          <div className={styles.altBaslik}><strong>Son gönderimler</strong><span>Şifreler güvenlik nedeniyle burada gösterilmez.</span></div>
          {recentInvites.length === 0 ? <p className={styles.siparisBos}>Henüz indirme daveti gönderilmedi.</p> : <div className={styles.davetListe}>
            {recentInvites.map((invite) => {
              const expired = new Date(invite.passwordExpiresAt).getTime() <= Date.now();
              const state = invite.revokedAt ? 'İptal' : expired ? 'Süresi doldu' : invite.openedAt ? 'Açıldı' : invite.sentAt ? 'Gönderildi' : 'Hazırlanıyor';
              return <article key={invite.id}>
                <div><strong>{invite.name}</strong><span>{invite.email}</span></div>
                <div><strong>{state}</strong><span>{invite.openedAt ? `İlk açılış ${formatDate(invite.openedAt)}` : `Gönderim ${formatDate(invite.sentAt)}`}</span></div>
                <div><strong>{formatDate(invite.passwordExpiresAt)}</strong><span>Geçici şifre sonu</span></div>
              </article>;
            })}
          </div>}
          <details className={styles.reauth}>
            <summary>Ödeme onayı ve davet gönderimi için Authenticator ile yeniden doğrula</summary>
            <form onSubmit={reauthenticate}>
              <label>6 haneli kod<input value={kod} onChange={(event) => setKod(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /></label>
              <label>Kurtarma kodu<input value={kurtarmaKodu} onChange={(event) => setKurtarmaKodu(event.target.value.toUpperCase())} /></label>
              <button className={styles.ikincil} disabled={busy || (!kod && !kurtarmaKodu)}>10 dakika için doğrula</button>
            </form>
          </details>
        </section>}

        {!isPayments && <><div className={styles.listeKontrolleri}>
          <label className={styles.arama}>Lisanslarda ara
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad, soyad, e-posta veya lisans no" autoComplete="off" />
          </label>
          <nav className={styles.filtre} aria-label="Uygulama filtresi">
            {['hermes', 'astropen', 'tumu'].map((item) => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item === 'tumu' ? 'Tümü' : item === 'astropen' ? 'AstroPen' : 'Hermes'} <span>{item === 'tumu' ? matchingRows.length : matchingRows.filter((row) => row.application === item).length}</span></button>)}
          </nav>
        </div>

        <div className={styles.grid}>
          <section className={styles.liste} aria-label="Lisans listesi">
            {visible.length === 0 ? <p className={styles.bos}>{search.trim() ? 'Aramana uyan lisans bulunamadı.' : 'Bu görünümde lisans yok.'}</p> : visible.map((row) => (
              <button key={row.licenseNo} className={row.licenseNo === selectedNo ? styles.secili : ''} onClick={() => setSelectedNo(row.licenseNo)}>
                <div className={styles.listeKimlik}><strong>{row.licenseNo}</strong><span>{row.customerRef || row.application} · {row.application} · {row.signedLevel}</span>{row.customerEmail && <small>{row.customerEmail}</small>}</div><Status value={row.status} monitoring={row.monitoringOnly} />
              </button>
            ))}
          </section>

          <section className={styles.detay} aria-live="polite">
            {!selected ? <p className={styles.bos}>İncelemek için bir lisans seç.</p> : <>
              <div className={styles.detayBas}><div><span>{selected.application}</span><h2>{selected.licenseNo}</h2><Status value={selected.status} monitoring={selected.monitoringOnly} /></div><button className={styles.ikincil} onClick={loadHistory} disabled={busy}>Geçmişi getir</button></div>
              <dl className={styles.ozet}>
                <div><dt>Veriliş</dt><dd>{formatDate(selected.issuedAt)}</dd></div><div><dt>Bitiş</dt><dd>{formatDate(selected.expiresAt)}</dd></div>
                <div><dt>Son durum değişimi</dt><dd>{formatDate(selected.statusChangedAt)}</dd></div><div><dt>Askı bitişi</dt><dd>{formatDate(selected.suspendedUntil)}</dd></div>
                <div><dt>Müşteri</dt><dd>{selected.customerRef || '—'}</dd></div><div><dt>E-posta</dt><dd>{selected.customerEmail || '—'}</dd></div><div><dt>Etkin cihaz</dt><dd>{selected.devices.length} / {selected.deviceLimit}</dd></div><div><dt>Yetki sürümü</dt><dd>{selected.authorizationVersion}</dd></div>
              </dl>

              <label className={styles.gerekce}>İşlem gerekçesi<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} /></label>

              {mayStatus && <section className={styles.eylemKart}><h3>Durum</h3><div className={styles.eylemSatir}><label>Askı günü<input type="number" min="1" max={role === 'destek' ? 7 : 365} value={suspensionDays} onChange={(e) => setSuspensionDays(Number(e.target.value))} /></label><button className={styles.ikincil} disabled={busy || !reason.trim()} onClick={() => action('/api/lisans/v1/yonetim/durum', { lisansNo: selected.licenseNo, durum: 'askida', gerekce: reason, askiGun: suspensionDays }, 'Lisans askıya alındı.')}>Askıya al</button><button className={styles.ikincil} disabled={busy || !reason.trim()} onClick={() => action('/api/lisans/v1/yonetim/durum', { lisansNo: selected.licenseNo, durum: 'aktif', gerekce: reason }, 'Lisans etkinleştirildi.')}>Etkinleştir</button></div></section>}

              {mayTransfer && <section className={styles.eylemKart}><h3>Cihaz transferi</h3><p>Etkin cihaz bırakılır; yeni cihaz ilk güvenli doğrulamada bağlanır.</p><button className={styles.ikincil} disabled={busy || !reason.trim() || !selected.devices.length} onClick={() => action('/api/lisans/v1/yonetim/cihaz-transferi', { lisansNo: selected.licenseNo, cihazId: selected.devices[0]?.id, gerekce: reason }, 'Cihaz transferi başlatıldı.')}>Etkin cihazı bırak</button></section>}

              {mayRights && <section className={styles.eylemKart}><h3>Etkin yetkiler</h3><label>Seviye<select value={remoteLevel} onChange={(e) => setRemoteLevel(e.target.value)}>{LEVELS.map((level) => <option key={level} value={level} disabled={LEVELS.indexOf(level) > LEVELS.indexOf(selected.signedLevel)}>{level}</option>)}</select></label><div className={styles.ozellikler}>{FEATURES.map((feature) => <label key={feature} className={!signedFeatures.includes(feature) ? styles.kapali : ''}><input type="checkbox" checked={remoteFeatures.includes(feature)} disabled={!signedFeatures.includes(feature)} onChange={(e) => setRemoteFeatures((current) => e.target.checked ? [...current, feature] : current.filter((item) => item !== feature))} />{feature}</label>)}</div><button className={styles.ikincil} disabled={busy || !reason.trim()} onClick={() => action('/api/lisans/v1/yonetim/yetki', { lisansNo: selected.licenseNo, seviye: remoteLevel, ozellikler: remoteFeatures, gerekce: reason }, 'Yetki profili güncellendi.')}>Yetkileri kaydet</button></section>}

              {role === 'sahip' && <section className={styles.eylemKart}><h3>Uygulama modu</h3><p>İzleme modu kullanıcıyı kilitlemez. Yaptırıma hazırlamak tek başına yeterli değildir; global sunucu kapısı da ayrıca açılmalıdır.</p><button className={styles.ikincil} disabled={busy || !reason.trim()} onClick={() => action('/api/lisans/v1/yonetim/yaptirim', { lisansNo: selected.licenseNo, izlemeModu: !selected.monitoringOnly, gerekce: reason }, selected.monitoringOnly ? 'Lisans yaptırıma hazırlandı.' : 'Lisans izleme moduna alındı.')}>{selected.monitoringOnly ? 'Yaptırıma hazırla' : 'İzleme moduna al'}</button></section>}

              {role === 'sahip' && <section className={styles.tehlike}><h3>Kalıcı iptal</h3><p>Bu lisans yeniden etkinleştirilemez. Önce aşağıdaki yeniden doğrulama alanını kullan.</p><label>Lisans numarasını yaz<input value={confirmNo} onChange={(e) => setConfirmNo(e.target.value.toUpperCase())} /></label><button disabled={busy || !reason.trim() || confirmNo !== selected.licenseNo} onClick={() => action('/api/lisans/v1/yonetim/durum', { lisansNo: selected.licenseNo, durum: 'iptal', gerekce: reason, lisansNoOnayi: confirmNo }, 'Lisans kalıcı olarak iptal edildi.')}>Kalıcı iptal et</button></section>}

              <details className={styles.reauth}><summary>Kritik işlem için yeniden doğrula</summary><form onSubmit={reauthenticate}><label>6 haneli kod<input value={kod} onChange={(e) => setKod(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /></label><label>Kurtarma kodu<input value={kurtarmaKodu} onChange={(e) => setKurtarmaKodu(e.target.value.toUpperCase())} /></label><button className={styles.birincil} disabled={busy || (!kod && !kurtarmaKodu)}>10 dakika için doğrula</button></form></details>

              {history.length > 0 && <section className={styles.gecmis}><h3>İşlem geçmişi</h3>{history.map((event) => <article key={event.requestId}><div><strong>{event.action}</strong><time>{formatDate(event.createdAt)}</time></div><p>{event.reason || 'Gerekçe yok'}</p><small>{event.actorRole || 'sistem'} · {event.outcome}</small></article>)}</section>}
            </>}
          </section>
        </div>

        {role === 'sahip' && <section className={styles.yoneticiPanel} aria-labelledby="yonetici-baslik">
          <div className={styles.yoneticiBas}>
            <div><span className={styles.kicker}>SAHİP YETKİSİ</span><h2 id="yonetici-baslik">Lisans yöneticileri</h2><p>Yalnız mevcut site yöneticilerine sınırlı lisans rolü verilir. Rol veya etkinlik değişince kişinin bütün lisans oturumları kapatılır.</p></div>
            <button className={styles.ikincil} onClick={loadAdminUsers} disabled={busy}>Yöneticileri getir</button>
          </div>
          {adminUsers.length > 0 && <>
            <label className={styles.gerekce}>Yetki değişikliği gerekçesi<textarea value={adminReason} onChange={(event) => setAdminReason(event.target.value)} rows={2} maxLength={1000} /></label>
            <div className={styles.yoneticiListe}>
              {adminUsers.map((user) => {
                const draft = adminDrafts[user.email] || { rol: user.licenseRole || 'denetci', aktif: Boolean(user.licenseActive) };
                const locked = user.kendisi || user.sahip;
                return <article key={user.id}>
                  <div><strong>{user.email}</strong><span>MFA: {user.licenseMfaEnabled ? 'etkin' : 'kurulmamış'} · Son giriş: {formatDate(user.licenseLastLoginAt)}</span></div>
                  <label>Rol<select value={draft.rol} disabled={locked || busy} onChange={(event) => updateAdminDraft(user.email, 'rol', event.target.value)}>{locked && <option value="sahip">sahip</option>}{ADMIN_ROLES.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
                  <label className={styles.etkinSec}><input type="checkbox" checked={draft.aktif} disabled={locked || busy} onChange={(event) => updateAdminDraft(user.email, 'aktif', event.target.checked)} />Lisans yönetimi etkin</label>
                  <button className={styles.ikincil} disabled={locked || busy || adminReason.trim().length < 3} onClick={() => saveAdminUser(user)}>{locked ? 'Sahip hesabı' : 'Yetkiyi kaydet'}</button>
                </article>;
              })}
            </div>
          </>}
          <details className={styles.reauth}><summary>Yetki değişikliği için yeniden doğrula</summary><form onSubmit={reauthenticate}><label>6 haneli kod<input value={kod} onChange={(event) => setKod(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /></label><label>Kurtarma kodu<input value={kurtarmaKodu} onChange={(event) => setKurtarmaKodu(event.target.value.toUpperCase())} /></label><button className={styles.birincil} disabled={busy || (!kod && !kurtarmaKodu)}>10 dakika için doğrula</button></form></details>
        </section>}</>}
      </div>
    </main>
  );
}
