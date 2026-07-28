'use client';

import { useEffect, useMemo, useState } from 'react';
import { Nav } from '@/components/Chrome';
import styles from './posta.module.css';

const TOKEN_KEY = 'h_admin_key';
const KLASORLER = [
  ['inbox', 'Gelen', 'inbox'],
  ['starred', 'Yıldızlı', 'starred'],
  ['sent', 'Gönderilen', 'sent'],
  ['archive', 'Arşiv', 'archive'],
  ['spam', 'Spam', 'spam']
];

function tarih(value, uzun = false) {
  if (!value) return '';
  const d = new Date(value);
  return new Intl.DateTimeFormat('tr-TR', uzun
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
}

function kisaMetin(thread) {
  const mesaj = thread.lastMessage;
  return String(mesaj?.text || mesaj?.subject || 'İleti içeriği').replace(/\s+/g, ' ').trim().slice(0, 135);
}

function ilkHarf(thread) {
  return String(thread.participantName || thread.participantEmail || '?').trim().charAt(0).toLocaleUpperCase('tr-TR');
}

export default function PostaClient() {
  const [token, setToken] = useState(null);
  const [folder, setFolder] = useState('inbox');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [threads, setThreads] = useState([]);
  const [counts, setCounts] = useState({});
  const [mailboxes, setMailboxes] = useState([]);
  const [transport, setTransport] = useState({ sending: false, receiving: false });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState({ to: '', from: '', subject: '', text: '' });
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try { setToken(sessionStorage.getItem(TOKEN_KEY) || ''); } catch { setToken(''); }
  }, []);

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      },
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const e = new Error(data.error || 'İşlem tamamlanamadı.');
      e.status = response.status;
      throw e;
    }
    return data;
  }

  async function listeYukle() {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const data = await api(`/api/mail?folder=${encodeURIComponent(folder)}&q=${encodeURIComponent(search)}`);
      setThreads(data.threads || []);
      setCounts(data.counts || {});
      setMailboxes(data.mailboxes || []);
      setTransport(data.configured || { sending: false, receiving: false });
      setDraft((s) => ({ ...s, from: s.from || data.mailboxes?.[0] || '' }));
      if (selected && !(data.threads || []).some((x) => x.id === selected)) {
        setSelected(null); setDetail(null);
      }
    } catch (e) {
      setError(e.status === 401 ? 'Yönetim oturumu geçersiz. Yeniden giriş yapın.' : e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { listeYukle(); }, [token, folder, search]);

  async function konuşmaAc(id) {
    const oncekiOkunmamis = Number(threads.find((x) => x.id === id)?.unreadCount || 0);
    setSelected(id); setCompose(false); setError('');
    try {
      const data = await api(`/api/mail/${id}`);
      setDetail(data);
      setThreads((list) => list.map((x) => x.id === id ? { ...x, unreadCount: 0 } : x));
      setCounts((x) => ({ ...x, unread: Math.max(0, Number(x.unread || 0) - oncekiOkunmamis) }));
    } catch (e) { setError(e.message); }
  }

  async function threadGuncelle(data) {
    if (!detail) return;
    setError('');
    try {
      const next = await api(`/api/mail/${detail.id}`, { method: 'PATCH', body: JSON.stringify(data) });
      setDetail((x) => ({ ...x, ...next }));
      await listeYukle();
    } catch (e) { setError(e.message); }
  }

  async function gonder(payload) {
    if (sending) return;
    setSending(true); setError('');
    try {
      const data = await api('/api/mail/send', { method: 'POST', body: JSON.stringify(payload) });
      setCompose(false); setReply('');
      setDraft({ to: '', from: mailboxes[0] || '', subject: '', text: '' });
      if (!payload.threadId) setFolder('sent');
      await konuşmaAc(data.threadId);
      if (payload.threadId) await listeYukle();
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  }

  async function ekAc(messageId, attachmentId) {
    setError('');
    try {
      const data = await api(`/api/mail/${messageId}/attachment/${attachmentId}`);
      const pencere = window.open(data.url, '_blank', 'noopener,noreferrer');
      if (!pencere) setError('Tarayıcı ek dosya penceresini engelledi.');
    } catch (e) { setError(e.message); }
  }

  const aktifSayac = useMemo(() => Number(counts[folder] || 0), [counts, folder]);

  if (token === null) return <main><Nav active="/yonetim" /><div className={styles.bekle}>Posta merkezi hazırlanıyor…</div></main>;
  if (!token) {
    return (
      <main>
        <Nav active="/yonetim" />
        <section className={styles.giris}>
          <span>YÖNETİM · POSTA</span>
          <h1>Önce yönetim girişi gerekli</h1>
          <p>Kurumsal mesajlar yalnız yetkili yönetim oturumunda görüntülenebilir.</p>
          <a href="/yonetim">Yönetim girişine dön</a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.sayfa}>
      <Nav active="/yonetim" />
      <section className={styles.kabuk} aria-label="Hermes Kurumsal Posta Merkezi">
        <header className={styles.ust}>
          <div>
            <span className={styles.kicker}>YÖNETİM · KURUMSAL POSTA</span>
            <h1>Posta Merkezi</h1>
            <p>
              {counts.unread ? `${counts.unread} okunmamış ileti` : 'Gelen kutusu güncel'} · {mailboxes.length || 1} kurumsal adres
              <span className={transport.sending && transport.receiving ? styles.baglantiHazir : styles.baglantiBekliyor}>
                {transport.sending && transport.receiving ? 'Gönderim ve alım bağlı' : 'Dış posta bağlantısı bekliyor'}
              </span>
            </p>
          </div>
          <div className={styles.ustEylem}>
            <button type="button" className={styles.hafif} onClick={() => listeYukle()} disabled={loading}>Yenile</button>
            <button type="button" className={styles.birincil} onClick={() => { setCompose(true); setSelected(null); setDetail(null); }}>Yeni ileti</button>
          </div>
        </header>

        {error && <div className={styles.hata} role="alert">{error}</div>}

        <div className={styles.grid}>
          <aside className={styles.klasorler} aria-label="Posta klasörleri">
            {KLASORLER.map(([id, ad]) => (
              <button key={id} type="button" className={folder === id ? styles.klasorAktif : ''}
                onClick={() => { setFolder(id); setSelected(null); setDetail(null); setCompose(false); }}>
                <span>{ad}</span>
                <b>{id === 'inbox' && counts.unread ? counts.unread : counts[id] || 0}</b>
              </button>
            ))}
            <div className={styles.kutuListesi}>
              <span>BAĞLI ADRESLER</span>
              {mailboxes.map((x) => <small key={x}>{x}</small>)}
            </div>
          </aside>

          <section className={styles.liste} aria-label={`${folder} konuşmaları`}>
            <form className={styles.arama} onSubmit={(e) => { e.preventDefault(); setSearch(query); }}>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ad, adres veya konu ara…" aria-label="Postada ara" />
              <button type="submit">Ara</button>
            </form>
            <div className={styles.listeBas}>
              <strong>{KLASORLER.find((x) => x[0] === folder)?.[1]}</strong>
              <span>{aktifSayac} konuşma</span>
            </div>
            <div className={styles.threadler}>
              {loading && !threads.length ? <div className={styles.bos}>İletiler yükleniyor…</div> : null}
              {!loading && !threads.length ? <div className={styles.bos}>Bu klasörde henüz ileti yok.</div> : null}
              {threads.map((thread) => (
                <button type="button" key={thread.id} onClick={() => konuşmaAc(thread.id)}
                  className={`${styles.thread} ${selected === thread.id ? styles.threadAktif : ''} ${thread.unreadCount ? styles.okunmadi : ''}`}>
                  <span className={styles.avatar}>{ilkHarf(thread)}</span>
                  <span className={styles.threadGovde}>
                    <span className={styles.threadUst}>
                      <strong>{thread.participantName || thread.participantEmail || 'Bilinmeyen gönderici'}</strong>
                      <time>{tarih(thread.lastMessageAt)}</time>
                    </span>
                    <span className={styles.konu}>{thread.starred ? '★ ' : ''}{thread.subject}</span>
                    <span className={styles.onizleme}>{kisaMetin(thread)}</span>
                    <span className={styles.meta}>{thread._count?.messages || 1} ileti{thread.unreadCount ? ` · ${thread.unreadCount} yeni` : ''}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.detay} aria-live="polite">
            {compose ? (
              <form className={styles.yazim} onSubmit={(e) => { e.preventDefault(); gonder(draft); }}>
                <div className={styles.detayBas}><div><span>YENİ İLETİ</span><h2>Yeni konuşma</h2></div><button type="button" onClick={() => setCompose(false)}>Kapat</button></div>
                <label>Gönderen
                  <select value={draft.from} onChange={(e) => setDraft((s) => ({ ...s, from: e.target.value }))}>
                    {mailboxes.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Alıcı
                  <input required type="email" value={draft.to} onChange={(e) => setDraft((s) => ({ ...s, to: e.target.value }))} placeholder="musteri@ornek.com" />
                </label>
                <label>Konu
                  <input required value={draft.subject} onChange={(e) => setDraft((s) => ({ ...s, subject: e.target.value }))} />
                </label>
                <label>Mesaj
                  <textarea required rows={12} value={draft.text} onChange={(e) => setDraft((s) => ({ ...s, text: e.target.value }))} placeholder="Merhaba…" />
                </label>
                <button className={styles.birincil} disabled={sending}>{sending ? 'Gönderiliyor…' : 'İletiyi gönder'}</button>
              </form>
            ) : detail ? (
              <>
                <div className={styles.detayBas}>
                  <div><span>{detail.mailbox}</span><h2>{detail.subject}</h2><p>{detail.participantName || detail.participantEmail} · {detail.messages.length} ileti</p></div>
                  <div className={styles.detayEylem}>
                    <button type="button" title="Yıldızla" onClick={() => threadGuncelle({ starred: !detail.starred })}>{detail.starred ? '★' : '☆'}</button>
                    <button type="button" onClick={() => threadGuncelle({ folder: 'archive' })}>Arşivle</button>
                    <button type="button" onClick={() => threadGuncelle({ folder: 'spam' })}>Spam</button>
                  </div>
                </div>
                <div className={styles.mesajlar}>
                  {detail.messages.map((message) => {
                    const ekler = Array.isArray(message.attachments) ? message.attachments : [];
                    return (
                      <article key={message.id} className={`${styles.mesaj} ${message.direction === 'outbound' ? styles.giden : styles.gelen}`}>
                        <header><div><strong>{message.direction === 'outbound' ? message.fromName || 'Hermes' : message.fromName || message.fromAddress}</strong><span>{message.direction === 'outbound' ? ` → ${detail.participantEmail}` : ` → ${detail.mailbox}`}</span></div><time>{tarih(message.createdAt, true)}</time></header>
                        {message.text ? <div className={styles.mesajMetni}>{message.text}</div>
                          : message.html ? <iframe title="E-posta HTML içeriği" sandbox="" referrerPolicy="no-referrer" srcDoc={message.html} className={styles.htmlIcerik} />
                            : <div className={styles.mesajMetni}>İleti gövdesi boş.</div>}
                        {ekler.length ? <div className={styles.ekler}>{ekler.map((ek) => (
                          <button key={ek.id} type="button" onClick={() => ekAc(message.id, ek.id)}>Ek · {ek.filename || 'dosya'}</button>
                        ))}</div> : null}
                      </article>
                    );
                  })}
                </div>
                <form className={styles.yanit} onSubmit={(e) => { e.preventDefault(); gonder({ threadId: detail.id, from: detail.mailbox, text: reply }); }}>
                  <label htmlFor="posta-yanit">Yanıtla</label>
                  <textarea id="posta-yanit" required rows={6} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`${detail.participantName || detail.participantEmail} için yanıtınızı yazın…`} />
                  <div><span>{detail.mailbox} adresinden gönderilecek</span><button className={styles.birincil} disabled={sending}>{sending ? 'Gönderiliyor…' : 'Yanıtı gönder'}</button></div>
                </form>
              </>
            ) : (
              <div className={styles.detayBos}><span>☿</span><h2>Bir konuşma seçin</h2><p>Mesajı okumak ve yanıtlamak için soldaki listeden bir konuşma açın.</p></div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
