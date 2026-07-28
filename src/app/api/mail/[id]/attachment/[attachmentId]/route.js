import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const err = requireAdmin(request); if (err) return err;
  const message = await prisma.mailMessage.findFirst({
    where: { id: params.id, direction: 'inbound' },
    select: { resendId: true, attachments: true }
  });
  if (!message?.resendId) return Response.json({ error: 'Ek bulunamadı.' }, { status: 404 });
  const ekler = Array.isArray(message.attachments) ? message.attachments : [];
  const ek = ekler.find((x) => String(x?.id) === params.attachmentId);
  if (!ek) return Response.json({ error: 'Ek bulunamadı.' }, { status: 404 });
  if (!process.env.RESEND_API_KEY) return Response.json({ error: 'Resend yapılandırması eksik.' }, { status: 503 });

  const response = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(message.resendId)}/attachments/${encodeURIComponent(params.attachmentId)}`,
    { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, cache: 'no-store' }
  );
  if (!response.ok) return Response.json({ error: 'Ek bağlantısı alınamadı.' }, { status: 502 });
  const data = await response.json();
  return Response.json({
    url: data.download_url,
    expiresAt: data.expires_at,
    filename: data.filename || ek.filename || 'ek'
  });
}
