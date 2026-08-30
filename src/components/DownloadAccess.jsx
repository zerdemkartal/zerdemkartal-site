'use client';

import { useEffect, useState } from 'react';
import styles from './CustomerLicense.module.css';

const ERROR_TEXT = {
  'indirme-erisimi-dogrulanamadi': 'Geçici şifre doğrulanamadı.',
  'indirme-daveti-suresi-doldu': 'Bu indirme bağlantısının 6 saatlik süresi dolmuş.',
  'indirme-daveti-iptal': 'Bu indirme daveti iptal edilmiş.',
  'indirme-daveti-kilitli': 'Çok sayıda yanlış deneme nedeniyle erişim 15 dakika kilitlendi.',
  'gecersiz-istek': 'Geçici şifre geçerli biçimde gönderilemedi.'
};

export default function DownloadAccess({ version, inviteToken = '', accessRequired = false }) {
  const [token, setToken] = useState(inviteToken);
  const [password, setPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let fragmentToken = '';
    let fragmentPassword = '';
    try {
      const params = new URLSearchParams(globalThis.location?.hash?.replace(/^#/, '') || '');
      fragmentToken = params.get('d') || '';
      fragmentPassword = params.get('p') || '';
    } catch {
      fragmentToken = '';
      fragmentPassword = '';
    }
    if (fragmentToken) setToken(fragmentToken);

    async function checkAccess() {
      try {
        const response = await fetch('/api/indir/erisim', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (data.tamam) {
          setReady(true);
          if (fragmentToken || fragmentPassword) globalThis.history?.replaceState?.({}, '', '/indir');
          return;
        }
        if (!fragmentToken || !fragmentPassword) return;

        setBusy(true);
        const unlockResponse = await fetch('/api/indir/erisim', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: fragmentToken, password: fragmentPassword })
        });
        const unlockData = await unlockResponse.json().catch(() => ({}));
        if (!unlockResponse.ok) throw new Error(unlockData.error || 'gecici-hata');
        if (!cancelled) {
          setReady(true);
          globalThis.history?.replaceState?.({}, '', '/indir');
        }
      } catch (requestError) {
        if (!cancelled) setError(ERROR_TEXT[requestError.message] || 'Erişim doğrulanamadı. Biraz sonra yeniden dene.');
      } finally {
        if (!cancelled) {
          setBusy(false);
          setChecking(false);
        }
      }
    }

    checkAccess();
    return () => { cancelled = true; };
  }, []);

  async function unlock(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      const response = await fetch('/api/indir/erisim', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'gecici-hata');
      setPassword(''); setReady(true);
      globalThis.history?.replaceState?.({}, '', '/indir');
    } catch (requestError) {
      setError(ERROR_TEXT[requestError.message] || 'Erişim doğrulanamadı. Biraz sonra yeniden dene.');
    } finally { setBusy(false); }
  }

  return (
    <section className={styles.kart} aria-labelledby="download-access-title">
      <div className={styles.rozet}>CERTUM İMZALI WINDOWS KURULUMU</div>
      <h2 className={styles.baslik} id="download-access-title">Hermes’i güvenle indir</h2>
      <p className={styles.aciklama}>
        Kurulum dosyanı Hermes’in kendi indirme sayfasından al. Lisansın kurulumdan sonra,
        program içindeki <strong>Lisans İste</strong> adımıyla hazırlanır.
      </p>

      <div className={styles.adimlar} aria-label="Kurulum ve lisans adımları">
        <article>
          <span>1</span>
          <div><strong>Kurulumu indir</strong><small>Windows kurulum dosyasını bilgisayarına kaydet.</small></div>
        </article>
        <article>
          <span>2</span>
          <div><strong>Lisans isteğini gönder</strong><small>Programda ad, soyad ve e-posta bilgini yazıp Lisans İste’ye bas.</small></div>
        </article>
        <article>
          <span>3</span>
          <div><strong>İmzalı lisansını aç</strong><small>Sana e-postayla gönderilen lisans anahtarını programda aç.</small></div>
        </article>
      </div>

      {checking ? <p className={styles.mesaj} role="status">İndirme erişimi kontrol ediliyor…</p> : ready ? (
        <a className={styles.eylem} href="/api/indir/windows">
          Windows kurulumunu indir{version ? ` · ${version}` : ''}
        </a>
      ) : token ? (
        <form className={styles.form} onSubmit={unlock}>
          <label className={styles.tam}>E-postandaki geçici şifre
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="one-time-code"
              minLength={8}
              maxLength={100}
              required
              autoFocus
            />
          </label>
          {error && <p className={`${styles.mesaj} ${styles.hata}`} role="alert">{error}</p>}
          <button className={styles.eylem} disabled={busy || password.length < 8}>
            {busy ? 'Doğrulanıyor…' : 'İndirme erişimini aç'}
          </button>
        </form>
      ) : (
        <p className={`${styles.mesaj} ${accessRequired ? styles.hata : ''}`} role={accessRequired ? 'alert' : 'status'}>
          {accessRequired
            ? 'İndirme oturumun sona ermiş. E-postandaki kişisel bağlantıyı yeniden açıp geçici şifreni gir.'
            : 'Kurulum yalnız kişisel davet bağlantısıyla açılır. Satın alma sonrası gelen e-postadaki bağlantıyı kullan.'}
        </p>
      )}
      <p className={styles.alt}>
        Lisans isteğinde cihaz kimliğin doğrudan Hermes Lisans Yönetimi’ne iletilir;
        bu indirme sayfasına gönderilmez.
      </p>
    </section>
  );
}
