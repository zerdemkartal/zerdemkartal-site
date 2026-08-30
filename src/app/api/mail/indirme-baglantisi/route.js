import { prisma } from '@/lib/db';
import { mailAccessActor, requireMailAccess } from '@/lib/auth';
import { createDownloadInvite } from '@/lib/download-invite.mjs';
import { SITE } from '@/lib/site';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Input = z.object({
  adSoyad: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  istekId: z.string().uuid()
}).strict();

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const accessError = await requireMailAccess(request, prisma, 'posta.gonder');
  if (accessError) return accessError;

  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Müşteri adı ve e-posta adresini kontrol edin.' }, 400);

  const q = parsed.data;
  const actor = mailAccessActor(request);
  try {
    const created = await createDownloadInvite({
      database: prisma,
      name: q.adSoyad,
      email: q.email,
      createdByRef: actor ? `posta:${actor.role}:${actor.email}`.slice(0, 240) : 'posta-merkezi'
    });
    const baglanti = `${SITE}/indir#d=${encodeURIComponent(created.linkToken)}&p=${encodeURIComponent(created.temporaryPassword)}`;
    return json({
      tamam: true,
      eposta: created.invite.email,
      baglanti,
      sonGecerlilik: created.passwordExpiresAt,
      istekId: q.istekId
    }, 201);
  } catch (error) {
    console.error('[mail/indirme-baglantisi] bağlantı oluşturulamadı', {
      istekId: q.istekId,
      error: String(error?.message || error || 'bilinmeyen-hata').slice(0, 500)
    });
    return json({ error: 'İndirme bağlantısı oluşturulamadı. Biraz sonra yeniden deneyin.' }, 500);
  }
}
