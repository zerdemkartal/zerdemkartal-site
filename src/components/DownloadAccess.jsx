'use client';

import { useEffect, useState } from 'react';
import styles from './CustomerLicense.module.css';

const ERROR_TEXT = {
  'indirme-erisimi-dogrulanamadi': 'Geçici şifre doğrulanamadı.',
  'indirme-daveti-suresi-doldu': 'Bu indirme davetinin 72 saatlik süresi dolmuş.',
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
    let fragment = '';
    try {
      fragment = globalThis.location?.hash?.startsWith('#d=')
        ? decodeURIComponent(globalThis.location.hash.slice(3))
        : '';
    } catch {
      fragment = '';
    }
    if (fragment) setToken(fragment);
    fetch('/api/indir/erisim', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setReady(Boolean(data.tamam)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setChecking(false); });
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
