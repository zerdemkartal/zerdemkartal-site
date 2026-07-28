import { verifyResendWebhook } from '@/lib/resend-webhook';
import { ingestIncomingEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  const raw = await request.text();
  if (!verifyResendWebhook(raw, request.headers)) {
    return Response.json({ error: 'Geçersiz webhook imzası.' }, { status: 401 });
  }
  const event = JSON.parse(raw);
  if (event.type !== 'email.received') return Response.json({ ok: true, ignored: true });

  const emailId = String(event.data?.email_id || '');
  const key = process.env.RESEND_API_KEY;
  if (!emailId || !key) return Response.json({ error: 'Resend yapılandırması eksik.' }, { status: 503 });

  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store'
  });
  if (!response.ok) return Response.json({ error: 'Gelen e-posta alınamadı.' }, { status: 502 });
  const sonuc = await ingestIncomingEmail(await response.json());
  return Response.json({ ok: true, duplicate: sonuc.duplicate });
}
