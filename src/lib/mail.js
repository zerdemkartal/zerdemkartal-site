import { prisma } from './db';
import { licensePriceFor, normalizeDeviceLimit } from './licensePricing';
import { INVOICE_TYPES } from './purchase-invoice.mjs';
import { assessMailSpam } from './mail-security.mjs';

const VARSAYILAN_KUTULAR = [
  'info@hermesastroloji.com'
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
  const oncekiEngel = kisi.address ? await prisma.mailThread.count({
    where: { participantEmail: kisi.address, folder: 'spam' }
  }) : 0;
  const spam = assessMailSpam({
    fromAddress: kisi.address,
    subject,
    text: email.text,
    html: email.html,
    headers: email.headers,
    blocklist: process.env.MAIL_SPAM_BLOCKLIST
  });
  const spamFolder = Boolean(oncekiEngel || spam.spam || thread?.folder === 'spam');

  if (!thread) {
    thread = await prisma.mailThread.create({
      data: {
        subject,
        normalizedSubject,
        participantName: kisi.name || null,
        participantEmail: kisi.address || null,
        mailbox,
        folder: spamFolder ? 'spam' : 'inbox',
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
      headers: {
        ...(email.headers && typeof email.headers === 'object' ? email.headers : {}),
        hermesSpam: { score: spam.score, reasons: spam.reasons, blockedSender: Boolean(oncekiEngel) }
      },
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
      folder: spamFolder ? 'spam' : 'inbox',
      unreadCount: { increment: 1 },
      lastMessageAt: createdAt
    }
  });
  return { duplicate: false, messageId: mesaj.id, threadId: thread.id };
}

/** Site iletişim formunu Resend'den gelmiş bir iletiyle aynı kutuya taşır. */
export async function ingestContactForm({ name, email, type, message, source = 'site-contact-form', metadata = {} }) {
  const subject = String(type || 'İletişim formu').slice(0, 500);
  const participantEmail = String(email || '').toLowerCase();
  const mailbox = mailboxAddresses()[0];
  const now = new Date();
  const spam = assessMailSpam({
    fromAddress: participantEmail,
    subject,
    text: message,
    source,
    blocklist: process.env.MAIL_SPAM_BLOCKLIST
  });
  const guvenliMetadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? Object.fromEntries(Object.entries(metadata).slice(0, 20).map(([key, value]) => [
        String(key).slice(0, 80),
        typeof value === 'number' || typeof value === 'boolean' ? value : String(value ?? '').slice(0, 500)
      ]))
    : {};
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({ data: { name, email: participantEmail, type: subject, message } });
    const thread = await tx.mailThread.create({
      data: {
        subject,
        normalizedSubject: normalizeSubject(subject),
        participantName: name,
        participantEmail,
        mailbox,
        folder: spam.spam ? 'spam' : 'inbox',
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
        headers: {
          ...guvenliMetadata,
          source: String(source).slice(0, 80),
          leadId: lead.id,
          hermesSpam: { score: spam.score, reasons: spam.reasons }
        },
        attachments: [],
        status: 'received',
        createdAt: now
      }
    });
    return { lead, thread };
  });
}

/** Satın alma formunu fatura bilgileriyle birlikte yanıtlanabilir e-posta konuşmasına dönüştürür. */
export async function ingestPurchaseRequest({
  firstName, lastName, email, phone, whatsappPhone, deviceLimit,
  invoiceType, companyTitle, taxNumber, taxOffice,
  billingAddress, billingDistrict, billingCity
}) {
  const limit = normalizeDeviceLimit(deviceLimit);
  const price = licensePriceFor(limit);
  const name = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
  const invoiceTitle = invoiceType === 'corporate' ? String(companyTitle).trim() : name;
  const invoiceTypeLabel = INVOICE_TYPES[invoiceType] || INVOICE_TYPES.individual;
  const subject = `Satın alma talebi · ${limit} cihaz · ₺${price.toLocaleString('tr-TR')}`;
  const message = [
    'Yeni Hermes satın alma talebi',
    '',
    `Ad soyad: ${name}`,
    `E-posta: ${String(email).trim().toLowerCase()}`,
    `Telefon: ${phone}`,
    `Lisans: ${limit} cihaz`,
    `Tutar: ₺${price.toLocaleString('tr-TR')} · KDV dahil`,
    '',
    'Fatura bilgileri',
    `Fatura türü: ${invoiceTypeLabel}`,
    `${invoiceType === 'corporate' ? 'Ticari unvan' : 'Fatura adı soyadı'}: ${invoiceTitle}`,
    `${invoiceType === 'corporate' ? 'Vergi kimlik numarası' : 'T.C. kimlik numarası'}: ${taxNumber}`,
    ...(invoiceType === 'corporate' ? [`Vergi dairesi: ${taxOffice}`] : []),
    `Fatura adresi: ${billingAddress}`,
    `İlçe / İl: ${billingDistrict} / ${billingCity}`,
    '',
    'Bu talep hermesastroloji.com/satin-al formundan gönderildi.'
  ].join('\n');
  return ingestContactForm({
    name,
    email,
    type: subject,
    message,
    source: 'purchase-request',
    metadata: {
      phone,
      whatsappPhone,
      deviceLimit: limit,
      price,
      vatIncluded: true,
      invoiceType,
      invoiceTitle,
      taxNumber,
      taxOffice,
      billingAddress,
      billingDistrict,
      billingCity
    }
  });
}
