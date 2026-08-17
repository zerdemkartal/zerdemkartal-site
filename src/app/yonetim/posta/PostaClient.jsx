'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPANY_OWNER, COMPANY_TRADE_NAME, WHATSAPP_DISPLAY } from '@/lib/site';
import styles from './posta.module.css';

const ADMIN_TOKEN_KEY = 'h_admin_key';
const MAIL_TOKEN_KEY = 'h_mail_key';
const LICENSE_TOKEN_KEY = 'h_license_jwt';
const DRAFT_KEY = 'h_mail_draft_v2';
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const KLASORLER = [
  ['inbox', 'Gelen', 'Yeni müşteri iletileri'],
  ['starred', 'Yıldızlı', 'Önemli konuşmalar'],
  ['sent', 'Gönderilen', 'Yanıtlanan iletiler'],
  ['archive', 'Arşiv', 'Tamamlanan işler'],
  ['spam', 'Spam', 'Filtrelenen iletiler'],
  ['trash', 'Çöp', 'Silinmeyi bekleyenler']
];
const SABLONLAR = [
  { id: 'soru', grup: 'Sorular', ad: 'Genel bilgi yanıtı' },
  { id: 'satin-alma', grup: 'Satın alma', ad: 'Ödeme bilgileri' },
  { id: 'fatura', grup: 'Satın alma', ad: 'Fatura gönderimi' },
  { id: 'sonrasi', grup: 'Satın alma sonrası', ad: 'Kurulum ve lisans adımları' },
  { id: 'destek', grup: 'Satın alma sonrası', ad: 'Teknik destek randevusu' }
];
const FIRMA_ADI = COMPANY_TRADE_NAME;
const HESAP_SAHIBI = COMPANY_OWNER;
const IBAN = 'TR06 0015 7000 0000 0138 8902 36';

function bosTaslak(from = '') {
  return { recipientName: '', to: '', from, subject: '', text: '', attachments: [] };
}

function tarih(value, uzun = false) {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat('tr-TR', uzun
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function kisaMetin(thread) {
  const message = thread.lastMessage;
  return String(message?.text || message?.subject || 'İleti içeriği').replace(/\s+/g, ' ').trim().slice(0, 135);
}

function ilkHarf(thread) {
  return String(thread.participantName || thread.participantEmail || '?').trim().charAt(0).toLocaleUpperCase('tr-TR');
}

function dosyaBoyutu(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function talepTelefon(detail) {
  for (const message of detail?.messages || []) {
    const headers = message?.headers && typeof message.headers === 'object' ? message.headers : {};
    const digits = String(headers.whatsappPhone || '').replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      return { display: String(headers.phone || `+${digits}`), digits };
    }
  }
  return null;
}

function whatsappTalepUrl(phone, name) {
  const message = `Merhaba ${name || ''}, Hermes satın alma talebiniz hakkında yazıyorum.`.replace(/\s+/g, ' ').trim();
  return `https://wa.me/${phone.digits}?text=${encodeURIComponent(message)}`;
}

function satinAlmaBilgisi(detail) {
  for (const message of detail?.messages || []) {
    const headers = message?.headers && typeof message.headers === 'object' ? message.headers : {};
    if (headers.source !== 'purchase-request') continue;
    const price = Number(headers.price || 0);
    const deviceLimit = Number(headers.deviceLimit || 0);
    const invoiceType = ['individual', 'corporate'].includes(headers.invoiceType) ? headers.invoiceType : null;
    return {
      price: Number.isFinite(price) && price > 0 ? price : null,
      deviceLimit: [1, 2].includes(deviceLimit) ? deviceLimit : null,
      invoice: invoiceType ? {
        type: invoiceType,
        title: String(headers.invoiceTitle || '').trim(),
        taxNumber: String(headers.taxNumber || '').trim(),
        taxOffice: String(headers.taxOffice || '').trim(),
        address: String(headers.billingAddress || '').trim(),
        district: String(headers.billingDistrict || '').trim(),
        city: String(headers.billingCity || '').trim()
      } : null
    };
  }
  const subject = String(detail?.subject || '');
  if (/^satın alma talebi\b/i.test(subject)) {
    const deviceMatch = subject.match(/(\d+)\s*cihaz/i);
    const priceMatch = subject.match(/₺\s*([\d.]+)/);
    const deviceLimit = Number(deviceMatch?.[1] || 0);
    const price = Number(String(priceMatch?.[1] || '').replace(/\./g, ''));
    return {
      price: Number.isFinite(price) && price > 0 ? price : null,
      deviceLimit: [1, 2].includes(deviceLimit) ? deviceLimit : null
    };
  }
  return null;
}

function odemeTalebiMetni(detail, purchase) {
  const name = String(detail?.participantName || '').trim();
  const secim = purchase?.deviceLimit ? `${purchase.deviceLimit} cihaz lisansı` : 'Hermes lisansı';
  const tutar = purchase?.price
    ? `₺${purchase.price.toLocaleString('tr-TR')} (KDV dahildir)`
    : 'Satın alma talebinizde belirtilen tutar';
  return [
    name ? `Merhaba ${name},` : 'Merhaba,', '',
    'Hermes Astroloji Programı satın alma talebiniz için teşekkür ederiz.', '',
    `Seçiminiz: ${secim}`, `Ödenecek tutar: ${tutar}`, '',
    'Banka havalesi bilgileri', `Firma: ${FIRMA_ADI}`, `Hesap sahibi: ${HESAP_SAHIBI}`, `IBAN: ${IBAN}`, '',
    'Ödeme açıklamasına adınızı ve soyadınızı yazmanızı rica ederiz.',
    `Ödeme tamamlandıktan sonra bu e-postayı yanıtlayarak veya WhatsApp üzerinden ${WHATSAPP_DISPLAY} numarasına bilgi verebilirsiniz.`, '',
    'Kurulum sürecinde ihtiyaç duymanız hâlinde uzaktan bağlantı ile destek sağlıyoruz.', '',
    'Saygılarımızla,', 'Hermes Astroloji Programı', FIRMA_ADI
  ].join('\n');
}

function sablonIcerigi(id, { name = '', detail = null, purchase = null } = {}) {
  const greeting = name ? `Merhaba ${name},` : 'Merhaba,';
  if (id === 'satin-alma') {
    return {
      subject: detail?.subject || 'Hermes satın alma ve ödeme bilgileri',
      text: odemeTalebiMetni(detail || { participantName: name }, purchase)
    };
  }
  if (id === 'fatura') return {
    subject: 'Hermes faturanız',
    text: [greeting, '', 'Hermes Astroloji Programı satın alımınıza ait faturanız ektedir.', '', 'Sorunuz olursa bu e-postayı yanıtlayabilirsiniz.', '', 'Saygılarımızla,', 'Hermes Astroloji Programı'].join('\n')
  };
  if (id === 'sonrasi') return {
    subject: 'Hermes kurulum ve lisans adımları',
    text: [greeting, '', 'Ödemeniz alınmıştır, teşekkür ederiz.', '', 'Kurulum erişiminiz ayrı bir güvenli e-posta ile gönderilecektir. Bu erişim 72 saatlik kişisel bağlantı ve geçici şifre içerir. Kurulumdan sonra programdaki Lisans İste alanını kullanabilirsiniz.', '', 'Kurulum sırasında desteğe ihtiyaç duyarsanız bu e-postayı yanıtlamanız yeterlidir.', '', 'Saygılarımızla,', 'Hermes Astroloji Programı'].join('\n')
  };
  if (id === 'destek') return {
    subject: detail?.subject || 'Hermes teknik destek',
    text: [greeting, '', 'Yaşadığınız durumu birlikte inceleyebiliriz.', '', 'Uygun olduğunuz gün ve saat aralığını, kullandığınız Windows sürümünü ve ekranda gördüğünüz hata metnini iletmenizi rica ederiz. Gerekirse uzaktan bağlantı randevusu planlayabiliriz.', '', 'Saygılarımızla,', 'Hermes Destek'].join('\n')
  };
  return {
    subject: detail?.subject || 'Hermes hakkında bilgi',
    text: [greeting, '', 'Hermes hakkındaki sorunuz için teşekkür ederiz.', '', 'Sorunuzu inceledik. Size doğru bilgi verebilmemiz için ihtiyaç duyduğunuz modülü veya kullanım senaryosunu biraz daha ayrıntılı paylaşabilir misiniz?', '', 'Saygılarımızla,', 'Hermes Astroloji Programı'].join('\n')
  };
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}

function attachmentContentType(file) {
  const name = String(file?.name || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return '';
}

export default function PostaClient() {
  const [token, setToken] = useState(null);
  const [credentials, setCredentials] = useState({ email: '', pass: '' });
  const [loginBusy, setLoginBusy] = useState(false);
  const [folder, setFolder] = useState('inbox');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [threads, setThreads] = useState([]);
  const [counts, setCounts] = useState({});
  const [mailboxes, setMailboxes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState(bosTaslak());
  const [draftReady, setDraftReady] = useState(false);
  const [reply, setReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [template, setTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const attachmentBusyRef = useRef(false);
  const [inviteBusy, setInviteBusy] = useState(false);

  useEffect(() => {
    document.body.classList.add('h-posta-app');
    return () => document.body.classList.remove('h-posta-app');
  }, []);

  useEffect(() => {
    try {
      setToken(sessionStorage.getItem(LICENSE_TOKEN_KEY) || sessionStorage.getItem(MAIL_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY) || '');
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (saved && typeof saved === 'object') setDraft({ ...bosTaslak(), ...saved, attachments: [] });
    } catch {}
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    try {
      const { attachments: ignored, ...safeDraft } = draft;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(safeDraft));
    } catch {}
  }, [draft, draftReady]);

  async function postaGir(event) {
    event.preventDefault();
    if (loginBusy) return;
    setLoginBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials), cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !['admin', 'mail_operator'].includes(data.role)) throw new Error(data.error || 'E-posta veya şifre hatalı.');
      sessionStorage.setItem(MAIL_TOKEN_KEY, data.token);
      setToken(data.token); setCredentials({ email: '', pass: '' });
    } catch (loginError) { setError(loginError.message); }
    finally { setLoginBusy(false); }
  }

  function cikisYap() {
    try { sessionStorage.removeItem(MAIL_TOKEN_KEY); sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
    setToken(''); setThreads([]); setDetail(null); setSelected(null); setError('');
  }

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
      const requestError = new Error(data.error || 'İşlem tamamlanamadı.');
      requestError.status = response.status;
      throw requestError;
    }
    return data;
  }

  async function listeYukle() {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const data = await api(`/api/mail?folder=${encodeURIComponent(folder)}&q=${encodeURIComponent(search)}`);
      setThreads(data.threads || []); setCounts(data.counts || {}); setMailboxes(data.mailboxes || []);
      setDraft((current) => ({ ...current, from: current.from || data.mailboxes?.[0] || '' }));
      setSelectedIds((ids) => ids.filter((id) => (data.threads || []).some((thread) => thread.id === id)));
      if (selected && !(data.threads || []).some((thread) => thread.id === selected)) {
        setSelected(null); setDetail(null);
      }
    } catch (loadError) {
      if (loadError.status === 401) {
        try { sessionStorage.removeItem(MAIL_TOKEN_KEY); } catch {}
        setToken(''); setError('Posta oturumu sona erdi. Yeniden giriş yapın.');
      } else setError(loadError.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { listeYukle(); }, [token, folder, search]);

  async function konusmaAc(id) {
    const previousUnread = Number(threads.find((thread) => thread.id === id)?.unreadCount || 0);
    setSelected(id); setCompose(false); setError(''); setReplyAttachments([]); setTemplate('');
    try {
      const data = await api(`/api/mail/${id}`);
      setDetail(data);
      const purchase = satinAlmaBilgisi(data);
      setReply(purchase ? odemeTalebiMetni(data, purchase) : '');
      setThreads((list) => list.map((thread) => thread.id === id ? { ...thread, unreadCount: 0 } : thread));
      setCounts((current) => ({ ...current, unread: Math.max(0, Number(current.unread || 0) - previousUnread) }));
    } catch (openError) { setError(openError.message); }
  }

  async function threadGuncelle(data) {
    if (!detail) return;
    setError(''); setNotice('');
    try {
      const next = await api(`/api/mail/${detail.id}`, { method: 'PATCH', body: JSON.stringify(data) });
      setDetail((current) => ({ ...current, ...next }));
      await listeYukle();
    } catch (updateError) { setError(updateError.message); }
  }

  async function topluIslem(action) {
    if (!selectedIds.length) return;
    const confirmation = action === 'delete'
      ? globalThis.prompt(`Seçili ${selectedIds.length} konuşma ve bütün iletileri kalıcı olarak silinecek. Devam etmek için SİL yaz:`)
      : null;
    if (action === 'delete' && confirmation !== 'SİL') return;
    setError(''); setNotice('');
    try {
      const data = await api('/api/mail/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds, action, ...(action === 'delete' ? { confirm: 'SİL' } : {}) })
      });
      setNotice(action === 'delete'
        ? `${data.deleted} konuşma kalıcı olarak silindi.`
        : `${data.updated} konuşma güncellendi.`);
      setSelectedIds([]); setSelected(null); setDetail(null);
      await listeYukle();
    } catch (bulkError) { setError(bulkError.message); }
  }

  async function kaliciSil() {
    if (!detail || folder !== 'trash') return;
    const confirmation = globalThis.prompt('Bu konuşma ve bütün ekleri kalıcı olarak silinecek. Devam etmek için SİL yaz:');
    if (confirmation !== 'SİL') return;
    setError('');
    try {
      await api(`/api/mail/${detail.id}`, { method: 'DELETE', body: JSON.stringify({ confirm: 'SİL' }) });
      setNotice('Konuşma kalıcı olarak silindi.'); setDetail(null); setSelected(null);
      await listeYukle();
    } catch (deleteError) { setError(deleteError.message); }
  }

  async function gonder(payload) {
    if (sending) return;
    if (attachmentBusyRef.current) {
      setError('Ek hazırlanıyor. Dosya gönderime hazır olduğunda yeniden deneyin.');
      return;
    }
    setSending(true); setError(''); setNotice('');
    try {
      const data = await api('/api/mail/send', { method: 'POST', body: JSON.stringify(payload) });
      setCompose(false); setReply(''); setReplyAttachments([]); setTemplate('');
      setDraft(bosTaslak(mailboxes[0] || ''));
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setNotice('E-posta gönderildi.');
      if (!payload.threadId) setFolder('sent');
      await konusmaAc(data.threadId);
      if (payload.threadId) await listeYukle();
    } catch (sendError) { setError(sendError.message); }
    finally { setSending(false); }
  }

  async function dosyaEkle(event, target) {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if (!files.length || attachmentBusyRef.current || sending) return;
    attachmentBusyRef.current = true;
    setAttachmentBusy(true);
    setError('');
    try {
      const current = target === 'draft' ? draft.attachments : replyAttachments;
      const next = [...current];
      for (const file of files) {
        const type = attachmentContentType(file);
        if (!type) throw new Error('Yalnız PDF, PNG ve JPG dosyaları eklenebilir.');
        if (/\.(?:exe|msi|bat|cmd|ps1)$/i.test(file.name)) throw new Error('Kurulum dosyası ek yerine güvenli indirme davetiyle gönderilir.');
        const total = next.reduce((sum, item) => sum + item.size, 0) + file.size;
        if (total > MAX_ATTACHMENT_BYTES) throw new Error('Eklerin toplam boyutu 3 MB sınırını aşıyor.');
        const content = await readFile(file);
        if (!content) throw new Error(`${file.name} dosyası okunamadı.`);
        next.push({ filename: file.name, contentType: type, size: file.size, content });
      }
      if (target === 'draft') setDraft((currentDraft) => ({ ...currentDraft, attachments: next }));
      else setReplyAttachments(next);
    } catch (fileError) { setError(fileError.message); }
    finally {
      attachmentBusyRef.current = false;
      setAttachmentBusy(false);
    }
  }

  function ekKaldir(index, target) {
    if (target === 'draft') setDraft((current) => ({ ...current, attachments: current.attachments.filter((_, itemIndex) => itemIndex !== index) }));
    else setReplyAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function sablonUygula(target) {
    if (!template) return;
    const name = target === 'draft' ? draft.recipientName : detail?.participantName;
    const content = sablonIcerigi(template, { name, detail, purchase: satinAlmaBilgisi(detail) });
    if (target === 'draft') setDraft((current) => ({ ...current, subject: content.subject, text: content.text }));
    else setReply(content.text);
  }

  async function kurulumDavetiGonder({ name, email }) {
    if (!name || !email || inviteBusy) {
      setError('Kurulum daveti için alıcı adı ve e-posta adresi gerekli.'); return;
    }
    if (!globalThis.confirm(`Ödemeyi doğruladıysanız ${email} adresine 72 saatlik kişisel Hermes indirme bağlantısı ve geçici şifre gönderilsin mi?`)) return;
    setInviteBusy(true); setError(''); setNotice('');
    try {
      await api('/api/lisans/v1/yonetim/indirme-daveti', {
        method: 'POST', body: JSON.stringify({
          adSoyad: name, email,
          gerekce: 'Posta Merkezi hazır indirme e-postası üzerinden güvenli kurulum erişimi gönderildi.',
          istekId: globalThis.crypto.randomUUID()
        })
      });
      setNotice('Hazır indirme e-postası gönderildi: kişisel bağlantı ve geçici şifre 72 saat geçerli.');
    } catch (inviteError) {
      setError(inviteError.status === 403
        ? 'Kurulum daveti için sahip oturumunda 10 dakikalık Authenticator yeniden doğrulaması gerekli.'
        : inviteError.message);
    } finally { setInviteBusy(false); }
  }

  async function ekAc(messageId, attachmentId) {
    setError('');
    try {
      const data = await api(`/api/mail/${messageId}/attachment/${attachmentId}`);
      const popup = window.open(data.url, '_blank', 'noopener,noreferrer');
      if (!popup) setError('Tarayıcı ek dosya penceresini engelledi.');
    } catch (attachmentError) { setError(attachmentError.message); }
  }

  const activeCount = useMemo(() => Number(counts[folder] || 0), [counts, folder]);
  const selectedPhone = useMemo(() => talepTelefon(detail), [detail]);
  const selectedPurchase = useMemo(() => satinAlmaBilgisi(detail), [detail]);
  const allSelected = threads.length > 0 && threads.every((thread) => selectedIds.includes(thread.id));

  if (token === null) return <main className={styles.sayfa}><div className={styles.bekle}>Posta merkezi hazırlanıyor…</div></main>;
  if (!token) return (
    <main className={styles.sayfa}>
      <section className={styles.giris}>
        <span>HERMES · KURUMSAL POSTA</span><h1>Posta Merkezi’ne giriş</h1>
        <p>Kurumsal iletileri okumak, yanıtlamak ve düzenlemek için yetkili hesabınızla giriş yapın.</p>
        {error && <div className={styles.hata} role="alert">{error}</div>}
        <form className={styles.girisForm} onSubmit={postaGir}>
          <label>E-posta<input type="email" autoComplete="username" required value={credentials.email} onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))} /></label>
          <label>Şifre<input type="password" autoComplete="current-password" required value={credentials.pass} onChange={(event) => setCredentials((current) => ({ ...current, pass: event.target.value }))} /></label>
          <button type="submit" className={styles.birincil} disabled={loginBusy}>{loginBusy ? 'Giriş yapılıyor…' : 'Posta merkezine gir'}</button>
        </form>
      </section>
    </main>
  );

  return (
    <main className={styles.sayfa}>
      <section className={styles.kabuk} aria-label="Hermes Kurumsal Posta Merkezi">
        {error && <div className={styles.hata} role="alert">{error}</div>}
        {notice && <div className={styles.bildirim} role="status">{notice}</div>}

        <div className={styles.grid}>
          <aside className={styles.klasorler} aria-label="Posta klasörleri">
            <button type="button" className={styles.yeniKisa} onClick={() => { setCompose(true); setSelected(null); setDetail(null); }}>Yeni ileti</button>
            <nav>
              {KLASORLER.map(([id, label, description]) => (
                <button key={id} type="button" className={folder === id ? styles.klasorAktif : ''}
                  onClick={() => { setFolder(id); setSelected(null); setSelectedIds([]); setDetail(null); setCompose(false); }}>
                  <span><strong>{label}</strong><small>{description}</small></span>
                  <b>{id === 'inbox' && counts.unread ? counts.unread : counts[id] || 0}</b>
                </button>
              ))}
            </nav>
            <div className={styles.kutuListesi}><span>BAĞLI ADRESLER</span>{mailboxes.map((mailbox) => <small key={mailbox}>{mailbox}</small>)}</div>
            <div className={styles.guvenlikNotu}><strong>Ek güvenliği</strong><p>PDF/fatura içeriği Vercel’de tutulmaz. Kurulum, kişisel bağlantıyla teslim edilir.</p></div>
            <div className={styles.oturumAraclari}><button type="button" onClick={cikisYap}>Çıkış</button></div>
          </aside>

          <section className={styles.liste} aria-label={`${folder} konuşmaları`}>
            <form className={styles.arama} onSubmit={(event) => { event.preventDefault(); setSearch(query); }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Postada ara" aria-label="Postada ara" />
              {search ? <button type="button" onClick={() => { setQuery(''); setSearch(''); }}>Temizle</button> : null}
              <button type="button" onClick={listeYukle} disabled={loading}>{loading ? 'Yükleniyor' : 'Yenile'}</button>
              <button type="submit">Ara</button>
            </form>
            <div className={styles.listeAraclari}>
              <label className={styles.hepsiniSec}><input type="checkbox" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? threads.map((thread) => thread.id) : [])} /><span className={styles.srOnly}>Tümünü seç</span></label>
              {selectedIds.length ? <div className={styles.toplu}>
                <strong>{selectedIds.length} seçili</strong>
                {folder === 'trash' ? <>
                  <button type="button" onClick={() => topluIslem('inbox')}>Gelen’e taşı</button>
                  <button type="button" className={styles.tehlike} onClick={() => topluIslem('delete')}>Kalıcı sil</button>
                </> : <>
                  <button type="button" onClick={() => topluIslem('archive')}>Arşivle</button>
                  <button type="button" onClick={() => topluIslem(folder === 'spam' ? 'inbox' : 'spam')}>{folder === 'spam' ? 'Gelen’e taşı' : 'Spam'}</button>
                  <button type="button" onClick={() => topluIslem('trash')}>Çöpe taşı</button>
                </>}
              </div> : <div className={styles.listeBas}><strong>{KLASORLER.find((item) => item[0] === folder)?.[1]}</strong><span>{activeCount} konuşma</span></div>}
            </div>
            <div className={styles.threadler}>
              {loading && !threads.length ? <div className={styles.bos}>İletiler yükleniyor…</div> : null}
              {!loading && !threads.length ? <div className={styles.bos}>Bu klasörde ileti yok.</div> : null}
              {threads.map((thread) => (
                <article key={thread.id} className={`${styles.thread} ${selected === thread.id ? styles.threadAktif : ''} ${thread.unreadCount ? styles.okunmadi : ''}`}>
                  <label className={styles.threadSec}><input type="checkbox" checked={selectedIds.includes(thread.id)} onChange={(event) => setSelectedIds((ids) => event.target.checked ? [...ids, thread.id] : ids.filter((id) => id !== thread.id))} /><span className={styles.srOnly}>{thread.subject} seç</span></label>
                  <button type="button" className={styles.yildiz} aria-label={thread.starred ? 'Yıldızı kaldır' : 'Yıldızla'} onClick={async () => { await api(`/api/mail/${thread.id}`, { method: 'PATCH', body: JSON.stringify({ starred: !thread.starred }) }); await listeYukle(); }}>{thread.starred ? '★' : '☆'}</button>
                  <button type="button" className={styles.threadAc} onClick={() => konusmaAc(thread.id)}>
                    <span className={styles.avatar}>{ilkHarf(thread)}</span>
                    <span className={styles.threadGovde}>
                      <span className={styles.threadUst}><strong>{thread.participantName || thread.participantEmail || 'Bilinmeyen gönderici'}</strong><time>{tarih(thread.lastMessageAt)}</time></span>
                      <span className={styles.konu}>{thread.subject}</span><span className={styles.onizleme}>{kisaMetin(thread)}</span>
                      <span className={styles.meta}>{thread._count?.messages || 1} ileti{thread.unreadCount ? ` · ${thread.unreadCount} yeni` : ''}{thread.lastMessage?.attachments?.length ? ' · ekli' : ''}</span>
                    </span>
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.detay} aria-live="polite">
            {compose ? (
              <form className={styles.yazim} onSubmit={(event) => { event.preventDefault(); gonder(draft); }}>
                <div className={styles.detayBas}><div><span>YENİ İLETİ</span><h2>Yeni konuşma</h2><p>Taslak bu tarayıcıda otomatik korunur.</p></div><button type="button" onClick={() => setCompose(false)}>Kapat</button></div>
                <div className={styles.formGovde}>
                  <div className={styles.ikiAlan}>
                    <label>Gönderen<select value={draft.from} onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}>{mailboxes.map((mailbox) => <option key={mailbox}>{mailbox}</option>)}</select></label>
                    <label>Alıcı adı<input required value={draft.recipientName} onChange={(event) => setDraft((current) => ({ ...current, recipientName: event.target.value }))} placeholder="Ad Soyad" /></label>
                  </div>
                  <label>Alıcı<input required type="email" value={draft.to} onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))} placeholder="musteri@ornek.com" /></label>
                  <label>Konu<input required value={draft.subject} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} /></label>
                  <div className={styles.sablonSatiri}><label>Hazır mesaj<select value={template} onChange={(event) => setTemplate(event.target.value)}><option value="">Şablon seçin</option>{SABLONLAR.map((item) => <option key={item.id} value={item.id}>{item.grup} · {item.ad}</option>)}</select></label><button type="button" onClick={() => sablonUygula('draft')} disabled={!template}>Şablonu uygula</button></div>
                  <label>Mesaj<textarea required rows={12} value={draft.text} onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))} placeholder="Merhaba…" /></label>
                  <AttachmentPicker attachments={draft.attachments} busy={attachmentBusy} disabled={sending || attachmentBusy} onAdd={(event) => dosyaEkle(event, 'draft')} onRemove={(index) => ekKaldir(index, 'draft')} />
                  <DeliveryPanel busy={inviteBusy} onSend={() => kurulumDavetiGonder({ name: draft.recipientName, email: draft.to })} />
                  <div className={styles.gonderSatiri}><span>{attachmentBusy ? 'Ek güvenli biçimde hazırlanıyor…' : 'Ek içeriği gönderimden sonra sunucuda saklanmaz.'}</span><button className={styles.birincil} disabled={sending || attachmentBusy}>{attachmentBusy ? 'Ek hazırlanıyor…' : sending ? 'Gönderiliyor…' : 'İletiyi gönder'}</button></div>
                </div>
              </form>
            ) : detail ? (
              <>
                <div className={styles.detayBas}>
                  <div><span>{detail.mailbox}</span><h2>{detail.subject}</h2><p>{detail.participantName || detail.participantEmail} · {detail.messages.length} ileti</p></div>
                  <div className={styles.detayEylem}>
                    {selectedPhone ? <a className={styles.whatsapp} href={whatsappTalepUrl(selectedPhone, detail.participantName)} target="_blank" rel="noopener noreferrer">WhatsApp · {selectedPhone.display}</a> : null}
                    <button type="button" title="Yıldızla" onClick={() => threadGuncelle({ starred: !detail.starred })}>{detail.starred ? '★' : '☆'}</button>
                    {folder === 'spam' ? <button type="button" onClick={() => threadGuncelle({ blockSender: false })}>Spam değil</button> : <button type="button" onClick={() => globalThis.confirm('Bu göndericinin mevcut ve yeni iletileri Spam klasörüne alınsın mı?') && threadGuncelle({ blockSender: true })}>Spam ve engelle</button>}
                    {folder === 'trash' ? <><button type="button" onClick={() => threadGuncelle({ folder: 'inbox' })}>Gelen’e taşı</button><button type="button" className={styles.tehlike} onClick={kaliciSil}>Kalıcı sil</button></> : <><button type="button" onClick={() => threadGuncelle({ folder: 'archive' })}>Arşivle</button><button type="button" onClick={() => threadGuncelle({ folder: 'trash' })}>Çöpe taşı</button></>}
                  </div>
                </div>
                {selectedPurchase?.invoice ? <InvoiceCard invoice={selectedPurchase.invoice} /> : null}
                <div className={styles.mesajlar}>
                  {detail.messages.map((message) => {
                    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
                    return <article key={message.id} className={`${styles.mesaj} ${message.direction === 'outbound' ? styles.giden : styles.gelen}`}>
                      <header><div><strong>{message.direction === 'outbound' ? message.fromName || 'Hermes' : message.fromName || message.fromAddress}</strong><span>{message.direction === 'outbound' ? ` → ${detail.participantEmail}` : ` → ${detail.mailbox}`}</span></div><time>{tarih(message.createdAt, true)}</time></header>
                      {message.text ? <div className={styles.mesajMetni}>{message.text}</div> : message.html ? <iframe title="E-posta HTML içeriği" sandbox="" referrerPolicy="no-referrer" srcDoc={message.html} className={styles.htmlIcerik} /> : <div className={styles.mesajMetni}>İleti gövdesi boş.</div>}
                      {attachments.length ? <div className={styles.ekler}>{attachments.map((attachment) => attachment.outbound
                        ? <span key={attachment.id || attachment.filename}>Ek · {attachment.filename || 'dosya'} · {dosyaBoyutu(Number(attachment.size || 0))}</span>
                        : <button key={attachment.id} type="button" onClick={() => ekAc(message.id, attachment.id)}>Ek · {attachment.filename || 'dosya'}</button>)}</div> : null}
                    </article>;
                  })}
                </div>
                {folder !== 'trash' ? <form className={styles.yanit} onSubmit={(event) => { event.preventDefault(); gonder({ threadId: detail.id, from: detail.mailbox, text: reply, attachments: replyAttachments }); }}>
                  <div className={styles.yanitBas}><div><strong>E-postayla cevap ver</strong><small>{selectedPurchase ? 'Satın alma bilgileri bu konuşmayla eşleşti.' : 'Yanıt aynı konuşmada tutulur.'}</small></div></div>
                  <div className={styles.sablonSatiri}><label>Hazır mesaj<select value={template} onChange={(event) => setTemplate(event.target.value)}><option value="">Şablon seçin</option>{SABLONLAR.map((item) => <option key={item.id} value={item.id}>{item.grup} · {item.ad}</option>)}</select></label><button type="button" onClick={() => sablonUygula('reply')} disabled={!template}>Şablonu uygula</button></div>
                  <textarea id="posta-yanit" required rows={7} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={`${detail.participantName || detail.participantEmail} için yanıtınızı yazın…`} />
                  <AttachmentPicker attachments={replyAttachments} busy={attachmentBusy} disabled={sending || attachmentBusy} onAdd={(event) => dosyaEkle(event, 'reply')} onRemove={(index) => ekKaldir(index, 'reply')} />
                  <DeliveryPanel busy={inviteBusy} onSend={() => kurulumDavetiGonder({ name: detail.participantName || detail.participantEmail?.split('@')[0], email: detail.participantEmail })} />
                  <div className={styles.gonderSatiri}><span>{attachmentBusy ? 'Ek güvenli biçimde hazırlanıyor…' : `${detail.mailbox} → ${detail.participantEmail}`}</span><button className={styles.birincil} disabled={sending || attachmentBusy}>{attachmentBusy ? 'Ek hazırlanıyor…' : sending ? 'Gönderiliyor…' : 'Yanıtı gönder'}</button></div>
                </form> : <div className={styles.copNotu}>Çöpteki konuşmalar yanıtlanamaz. Yanıtlamak için önce Gelen’e taşıyın.</div>}
              </>
            ) : <div className={styles.detayBos}><span>POSTA</span><h2>Bir konuşma seçin</h2><p>İletiyi okumak, yanıtlamak veya düzenlemek için listeden bir konuşma açın.</p></div>}
          </section>
        </div>
      </section>
    </main>
  );
}

function AttachmentPicker({ attachments, busy, disabled, onAdd, onRemove }) {
  return <section className={styles.ekAlani} aria-label="Dosya ekleri">
    <div><strong>Fatura veya belge ekle</strong><p aria-live="polite">{busy ? 'Dosya okunuyor ve gönderime hazırlanıyor…' : attachments.length ? `${attachments.length} ek gönderime hazır · toplam en fazla 3 MB` : 'PDF, PNG veya JPG · toplam en fazla 3 MB'}</p></div>
    <label className={styles.dosyaSec} aria-disabled={disabled}>{busy ? 'Hazırlanıyor…' : 'Dosya seç'}<input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple disabled={disabled} onChange={onAdd} /></label>
    {attachments.length ? <div className={styles.secilenEkler}>{attachments.map((attachment, index) => <span key={`${attachment.filename}-${index}`}><b>{attachment.filename}</b><small>{dosyaBoyutu(attachment.size)}</small><button type="button" disabled={disabled} aria-label={`${attachment.filename} ekini kaldır`} onClick={() => onRemove(index)}>Kaldır</button></span>)}</div> : null}
  </section>;
}

function DeliveryPanel({ busy, onSend }) {
  return <section className={styles.teslimatAlani}>
    <div><strong>Hazır e-posta · Kişisel indirme bağlantısı</strong><p>Kart ödemesinde otomatik gider. Havale ödemesini hesabınızda doğruladıktan sonra aynı 72 saatlik kişisel bağlantı ve geçici şifreyi buradan gönderebilirsiniz.</p></div>
    <button type="button" aria-label="Güvenli kurulum erişimi gönder" onClick={onSend} disabled={busy}>{busy ? 'Gönderiliyor…' : 'Hazır indirme e-postasını gönder'}</button>
  </section>;
}

function InvoiceCard({ invoice }) {
  return <section className={styles.faturaKart} aria-labelledby="posta-fatura-baslik">
    <div className={styles.faturaBas}><span>FATURA BİLGİLERİ</span><strong id="posta-fatura-baslik">{invoice.type === 'corporate' ? 'Kurumsal fatura' : 'Bireysel fatura'}</strong></div>
    <dl>
      <div><dt>{invoice.type === 'corporate' ? 'Ticari unvan' : 'Ad soyad'}</dt><dd>{invoice.title}</dd></div>
      <div><dt>{invoice.type === 'corporate' ? 'VKN' : 'TCKN'}</dt><dd>{invoice.taxNumber}</dd></div>
      {invoice.type === 'corporate' ? <div><dt>Vergi dairesi</dt><dd>{invoice.taxOffice}</dd></div> : null}
      <div className={styles.faturaAdres}><dt>Fatura adresi</dt><dd>{invoice.address}<br />{invoice.district} / {invoice.city}</dd></div>
    </dl>
  </section>;
}
