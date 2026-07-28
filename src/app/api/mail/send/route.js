import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { mailboxFrom, normalizeSubject, parseAddress } from '@/lib/mail';
import { sendMail } from '@/lib/email';
import { z } from 'zod';

const SendIn = z.object({
  threadId: z.string().cuid().optional(),
  to: z.string().trim().email().max(320).optional(),
  from: z.string().trim().email().max(320).optional(),
  subject: z.string().trim().min(1).max(500).optional(),
  text: z.string().trim().min(1).max(100_000)
});

function htmlKacir(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function mailHtml(text) {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f3efe6;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#241a12">
  <div style="max-width:680px;margin:auto;background:#fbfaf7;border:1px solid #e8e3d6;border-radius:16px;padding:28px">
    <div style="font:600 21px Georgia,serif;color:#6b4fa0;margin-bottom:22px">Hermes Astroloji</div>
    <div style="font-size:15px;line-height:1.75;white-space:pre-wrap">${htmlKacir(text)}</div>
    <div style="border-top:1px solid #e8e3d6;margin-top:28px;padding-top:16px;font-size:12px;color:#6b675e">hermesastroloji.com · Kurumsal Posta Merkezi</div>
  </div></body></html>`;
}

export async function POST(request) {
  const err = requireAdmin(request); if (err) return err;
  const parsed = SendIn.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Alıcı, konu ve mesajı kontrol edin.' }, { status: 400 });

  const girdi = parsed.data;
  let thread = null;
  let parent = null;
  if (girdi.threadId) {
    thread = await prisma.mailThread.findUnique({
      where: { id: girdi.threadId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
    if (!thread) return Response.json({ error: 'Konuşma bulunamadı.' }, { status: 404 });
    parent = thread.messages[0] || null;
  }

  const to = (thread?.participantEmail || girdi.to || '').toLowerCase();
  if (!to) return Response.json({ error: 'Alıcı e-posta adresi gerekli.' }, { status: 400 });
  const from = mailboxFrom(girdi.from || thread?.mailbox);
  const temelKonu = thread?.subject || girdi.subject || '(Konusuz)';
  const subject = thread && !/^\s*re\s*:/i.test(temelKonu) ? `Re: ${temelKonu}` : temelKonu;
  const headers = {};
  if (parent?.messageId) {
    headers['In-Reply-To'] = parent.messageId;
    headers.References = parent.messageId;
  }

  const sonuc = await sendMail({
    from: from.formatted,
    to,
    replyTo: from.address,
    subject,
    text: girdi.text,
    html: mailHtml(girdi.text),
    headers
  });
  if (!sonuc.ok) {
    return Response.json({ error: sonuc.skipped ? 'Resend henüz yapılandırılmadı.' : 'E-posta gönderilemedi.' }, { status: 503 });
  }

  const now = new Date();
  if (!thread) {
    const kisi = parseAddress(to);
    thread = await prisma.mailThread.create({
      data: {
        subject: temelKonu,
        normalizedSubject: normalizeSubject(temelKonu),
        participantEmail: kisi.address || to,
        participantName: kisi.name || null,
        mailbox: from.address,
        folder: 'sent',
        unreadCount: 0,
        lastMessageAt: now
      }
    });
  }
  const message = await prisma.mailMessage.create({
    data: {
      threadId: thread.id,
      resendId: sonuc.id,
      messageId: null,
      direction: 'outbound',
      fromAddress: from.address,
      fromName: process.env.MAILBOX_FROM_NAME || 'Hermes Astroloji',
      to: [to],
      cc: [],
      bcc: [],
      replyTo: [from.address],
      subject,
      text: girdi.text,
      html: mailHtml(girdi.text),
      headers,
      attachments: [],
      status: 'sent',
      sentBy: 'admin',
      createdAt: now
    }
  });
  await prisma.mailThread.update({
    where: { id: thread.id },
    data: { mailbox: from.address, lastMessageAt: now }
  });
  return Response.json({ ok: true, threadId: thread.id, messageId: message.id }, { status: 201 });
}
