import { prisma } from '@/lib/db';
import { downloadInvitationEmail } from '@/lib/email';
import {
  createDownloadInvite,
  revokeDownloadInvite
} from '@/lib/download-invite.mjs';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Input = z.object({
  adSoyad: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  gerekce: z.string().trim().min(3).max(1000),
  istekId: z.string().uuid()
}).strict();

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'gecersiz-istek' }, { status: 400 });
  const q = parsed.data;
  const access = await authorizeLicenseRequest({
    request,
    action: 'indirme.davet_gonder',
    database: prisma,
    reason: q.gerekce
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

  const repeated = await prisma.licenseEvent.findUnique({
    where: { requestId: q.istekId },
    select: { id: true }
  });
  if (repeated) {
    return Response.json({ tamam: true, tekrar: true, istekId: q.istekId }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  let created = null;
  try {
    created = await createDownloadInvite({
      database: prisma,
      name: q.adSoyad,
      email: q.email,
      createdByRef: access.actor.id
    });
    const sent = await downloadInvitationEmail({
      recipient: { name: q.adSoyad, email: q.email },
      access: created
    });
    if (!sent.ok) {
      await revokeDownloadInvite({ database: prisma, inviteId: created.invite.id });
      return Response.json({ error: 'e-posta-gonderilemedi', tekrarEdilebilir: true }, {
        status: 503,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.downloadInvite.update({
        where: { id: created.invite.id },
        data: { sentAt: now }
      });
      await appendLicenseEvent(tx, {
        licenseId: null,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: 'indirme.davet_gonder',
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: null,
        afterState: {
          davetId: created.invite.id,
          eposta: created.invite.email,
          uygulama: created.invite.application,
          sonGecerlilik: created.passwordExpiresAt.toISOString()
        },
        requestId: q.istekId,
        createdAt: now
      });
    });

    return Response.json({
      tamam: true,
      eposta: created.invite.email,
      sonGecerlilik: created.passwordExpiresAt,
      istekId: q.istekId
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (created?.invite?.id) {
      await revokeDownloadInvite({ database: prisma, inviteId: created.invite.id }).catch(() => {});
    }
    if (error?.code === 'P2002') {
      return Response.json({ error: 'istek-tekrarlandi' }, { status: 409 });
    }
    console.error('[download-invite] hata', String(error?.message || error));
    return Response.json({ error: 'gecici-hata' }, { status: 503 });
  }
}
