import { prisma } from '@/lib/db';
import { deliverPaytrCheckout } from '@/lib/paytr-delivery.mjs';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({
  checkoutId: z.string().trim().min(8).max(64),
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
    action: 'paytr.bildirim_gonder',
    database: prisma,
    reason: q.gerekce
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

  const repeated = await prisma.licenseEvent.findUnique({
    where: { requestId: q.istekId },
    select: { id: true }
  });
  if (repeated) return Response.json({ tamam: true, tekrar: true }, { headers: { 'Cache-Control': 'no-store' } });

  const checkout = await prisma.paytrCheckout.findUnique({
    where: { id: q.checkoutId },
    select: { id: true, merchantOid: true, status: true }
  });
  if (!checkout || checkout.status !== 'paid') {
    return Response.json({ error: 'paytr-odeme-kaydi-bulunamadi' }, { status: 404 });
  }

  const result = await deliverPaytrCheckout({ database: prisma, checkoutId: checkout.id });
  if (!result.ok) {
    return Response.json({ error: result.error || 'e-posta-gonderilemedi', tekrarEdilebilir: true }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  await appendLicenseEvent(prisma, {
    licenseId: null,
    actorId: access.actor.id,
    actorRole: access.actor.role,
    action: 'paytr.bildirim_gonder',
    outcome: 'basarili',
    reason: q.gerekce,
    beforeState: null,
    afterState: {
      checkoutId: checkout.id,
      merchantOid: checkout.merchantOid,
      tekrar: result.repeated
    },
    requestId: q.istekId,
    createdAt: new Date()
  });
  return Response.json({ tamam: true, tekrar: result.repeated }, { headers: { 'Cache-Control': 'no-store' } });
}
