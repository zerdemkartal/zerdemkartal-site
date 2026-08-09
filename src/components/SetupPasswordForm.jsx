'use client';

import { useEffect, useState } from 'react';
import styles from './CustomerLicense.module.css';

export default function SetupPasswordForm() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');
  const [licenseNo, setLicenseNo] = useState('');

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') || '';
    setToken(value);
    setState(value ? 'idle' : 'error');
    if (!value) setMessage('Kurulum bağlantısı eksik. Ödeme e-postasındaki düğmeyi yeniden açın.');
    window.history.replaceState(null, '', '/lisans-hesabi/kur');
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (state === 'sending') return;
    if (password.length < 10) {
      setState('error'); setMessage('Parola en az 10 karakter olmalıdır.'); return;
    }
    if (password !== confirmation) {
      setState('error'); setMessage('Parolalar birbiriyle aynı değil.'); return;
    }
    setState('sending'); setMessage('');
    try {
      const response = await fetch('/api/lisans/v1/musteri/sifre-olustur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.tamam) throw new Error(data.hata || 'Parola oluşturulamadı.');
      setPassword(''); setConfirmation(''); setToken('');
      setLicenseNo(data.lisansNo || '');
      setState('done');
    } catch (error) {
      setState('error');
      setMessage(error.message || 'Parola oluşturulamadı.');
    }
  }

  return (
    <section className={styles.kart} aria-labelledby="setup-title">
      <h2 className={styles.baslik} id="setup-title">Lisans parolanı oluştur</h2>
      <p className={styles.aciklama}>
        Bu parola hem sitedeki indirme ekranında hem de Hermes’in ilk açılışında kullanılacak.
      </p>
      {state === 'done' ? (
        <div aria-live="polite">
          <div className={styles.lisans}><span>Lisans numaran / kullanıcı ID’n</span><strong>{licenseNo}</strong></div>
          <div className={styles.form}>
            <p className={styles.mesaj}>Parolan güvenle oluşturuldu. Şimdi lisans bilgilerinle indirme sayfasına girebilirsin.</p>
            <a className={styles.eylem} href="/indir?hesap=hazir">İndirme sayfasına geç</a>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          <label>Yeni parola
            <input required type="password" minLength={10} maxLength={128} autoComplete="new-password"
              value={password} onChange={(event) => setPassword(event.target.value)}
              disabled={state === 'loading' || !token} placeholder="En az 10 karakter" />
          </label>
          <label>Parolayı tekrar yaz
            <input required type="password" minLength={10} maxLength={128} autoComplete="new-password"
              value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
              disabled={state === 'loading' || !token} placeholder="Aynı parolayı yaz" />
          </label>
          {state === 'error' && <p className={`${styles.mesaj} ${styles.hata}`} role="alert">{message}</p>}
          <button className={styles.eylem} type="submit" disabled={state === 'sending' || state === 'loading' || !token}>
            {state === 'sending' ? 'Kaydediliyor…' : 'Parolamı oluştur'}
          </button>
        </form>
      )}
      <p className={styles.alt}>Parolan e-postayla gönderilmez ve düz metin olarak saklanmaz.</p>
    </section>
  );
}
