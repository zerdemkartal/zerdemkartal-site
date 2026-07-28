import { prisma } from './db';

const VARSAYILAN_KUTULAR = [
  'merhaba@hermesastroloji.com',
  'destek@hermesastroloji.com',
  'siparis@hermesastroloji.com',
  'lisans@hermesastroloji.com'
];

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function mailboxAddresses() {
  const gelen = String(process.env.MAILBOX_ADDRESSES || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter((x) => EPOSTA.test(x));
  return [...new Set(gelen.length ? gelen : VARSAYILAN_KUTULAR)];
}

export function mailboxFrom(address) {
  const kutular = mailboxAddresses();
  const secilen = kutular.includes(String(address || '').toLowerCase())
    ? String(address).toLowerCase()
    : kutular[0];
  const ad = String(process.env.MAILBOX_FROM_NAME || 'Hermes Astroloji')
    .replace(/[\r\n<>"]/g, ' ')
    .trim()
    .slice(0, 100);
  return { address: secilen, formatted: `${ad || 'Hermes Astroloji'} <${secilen}>` };
}

export function parseAddress(value) {
  const ham = String(value || '').trim();
  const es = ham.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/);
  const address = (es ? es[2] : ham).trim().toLowerCase();
  const name = (es ? es[1] : '').trim().replace(/^"|"$/g, '').slice(0, 160);
  return { address: EPOSTA.test(address) ? address : '', name };
}

export function normalizeSubject(value) {
  let konu = String(value || '').trim().slice(0, 500);
  for (let i = 0; i < 8; i += 1) {
    const yeni = konu.replace(/^\s*(?:re|fw|fwd|ynt)\s*:\s*/i, '').trim();
    if (yeni === konu) break;
    konu = yeni;
  }
  return konu.toLocaleLowerCase('tr-TR') || '(konusuz)';
}

function dizi(value) {
  return Array.isArray(value) ? value.map(String).slice(0, 100) : value ? [String(value)] : [];
}

function guvenliTarih(value) {
  const tarih = new Date(value || Date.now());
  return Number.isNaN(tarih.getTime()) ? new Date() : tarih;
}

function metinSinir(value, azami) {
  if (value == null) return null;
  return String(value).slice(0, azami);
}

function baslikDegeri(headers, key) {
  if (!headers || typeof headers !== 'object') return '';
  const anahtar = Object.keys(headers).find((x) => x.toLowerCase() === key.toLowerCase());
  return anahtar ? String(headers[anahtar] || '') : '';
}

function referanslar(headers) {
  return [baslikDegeri(headers, 'in-reply-to'), baslikDegeri(headers, 'references')]
    .join(' ')
    .match(/<[^>]+>/g) || [];
}

async function iliskiliThread(email, kisi, normalizedSubject) {
  for (const messageId of referanslar(email.headers)) {
    const mesaj = await prisma.mailMessage.findUnique({
      where: { messageId },
      select: { threadId: true }
    }).catch(() => null);
    if (mesaj) return prisma.mailThread.findUnique({ where: { id: mesaj.threadId } });
  }
  if (!kisi.address) return null;
  return prisma.mailThread.findFirst({
    where: { normalizedSubject, participantEmail: kisi.address },
    orderBy: { lastMessageAt: 'desc' }
  });
}

/** Resend Receiving API yanıtını yinelenmeye dayanıklı biçimde yerel posta kutusuna yazar. */
export async function ingestIncomingEmail(email) {
  const resendId = String(email?.id || '').trim();
  if (!resendId) throw new Error('Gelen e-posta kimliği eksik.');
  const mevcut = await prisma.mailMessage.findUnique({ where: { resendId } });
  if (mevcut) return { duplicate: true, messageId: mevcut.id, threadId: mevcut.threadId };

  const kisi = parseAddress(email.headers?.from || email.from);
  const subject = metinSinir(email.subject || '(Konusuz)', 500);
  const normalizedSubject = normalizeSubject(subject);
  const kutular = mailboxAddresses();
  const alicilar = dizi(email.to).map((x) => x.toLowerCase());
  const mailbox = alicilar.find((x) => kutular.includes(x)) || alicilar[0] || kutular[0];
  const createdAt = guvenliTarih(email.created_at);
  let thread = await iliskiliThread(email, kisi, normalizedSubject);

  if (!thread) {
    thread = await prisma.mailThread.create({
      data: {
        subject,
        normalizedSubject,
        participantName: kisi.name || null,
        participantEmail: kisi.address || null,
        mailbox,
        folder: 'inbox',
        unreadCount: 0,
        lastMessageAt: createdAt
      }
    });
  }

  const mesaj = await prisma.mailMessage.create({
    data: {
      threadId: thread.id,
      resendId,
      messageId: metinSinir(email.message_id, 500),
      direction: 'inbound',
      fromAddress: kisi.address || String(email.from || '').slice(0, 320),
      fromName: kisi.name || null,
      to: dizi(email.to),
      cc: dizi(email.cc),
      bcc: dizi(email.bcc),
      replyTo: dizi(email.reply_to),
      subject,
      text: metinSinir(email.text, 2_000_000),
      html: metinSinir(email.html, 2_000_000),
      headers: email.headers && typeof email.headers === 'object' ? email.headers : {},
      attachments: Array.isArray(email.attachments) ? email.attachments.slice(0, 100) : [],
      status: 'received',
      createdAt
    }
  });

  await prisma.mailThread.update({
    where: { id: thread.id },
    data: {
      subject,
      normalizedSubject,
      participantName: kisi.name || thread.participantName,
      participantEmail: kisi.address || thread.participantEmail,
      mailbox,
      folder: thread.folder === 'spam' ? 'spam' : 'inbox',
      unreadCount: { increment: 1 },
      lastMessageAt: createdAt
    }
  });
  return { duplicate: false, messageId: mesaj.id, threadId: thread.id };
}

/** Site iletişim formunu Resend'den gelmiş bir iletiyle aynı kutuya taşır. */
export async function ingestContactForm({ name, email, type, message }) {
  const subject = String(type || 'İletişim formu').slice(0, 500);
  const participantEmail = String(email || '').toLowerCase();
  const mailbox = mailboxAddresses()[0];
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({ data: { name, email: participantEmail, type: subject, message } });
    const thread = await tx.mailThread.create({
      data: {
        subject,
        normalizedSubject: normalizeSubject(subject),
        participantName: name,
        participantEmail,
        mailbox,
        folder: 'inbox',
        unreadCount: 1,
        lastMessageAt: now
      }
    });
    await tx.mailMessage.create({
      data: {
        threadId: thread.id,
        messageId: `<site-form-${lead.id}@hermesastroloji.com>`,
        direction: 'inbound',
        fromAddress: participantEmail,
        fromName: name,
        to: [mailbox],
        cc: [],
        bcc: [],
        replyTo: [participantEmail],
        subject,
        text: message,
        html: null,
        headers: { source: 'site-contact-form', leadId: lead.id },
        attachments: [],
        status: 'received',
        createdAt: now
      }
    });
    return { lead, thread };
  });
}
