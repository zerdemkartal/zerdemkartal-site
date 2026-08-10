import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';

export const dynamic = 'force-dynamic';

function accessResponse(access) {
  return Response.json({ error: access.error }, {
    status: access.status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function GET(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const access = await authorizeLicenseRequest({
    request,
    action: 'siparis.listele',
    database: prisma
  });
  if (!access.ok) return accessResponse(access);

  const [orders, invites, paytrReceipts] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ['pending', 'paid', 'delivered'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        product: true,
        price: true,
        status: true,
        deviceLimit: true,
        payProvider: true,
        payRef: true,
        paidAt: true,
        paymentEmailSentAt: true,
        createdAt: true
      }
    }),
    prisma.downloadInvite.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: {
        id: true,
        orderId: true,
        name: true,
        email: true,
        application: true,
        passwordExpiresAt: true,
        openedAt: true,
        sentAt: true,
        revokedAt: true,
        createdAt: true
      }
    }),
    prisma.paymentReceipt.findMany({
      orderBy: { paidAt: 'desc' },
      take: 100,
      select: {
        id: true,
        merchantOid: true,
        planId: true,
        termsVersion: true,
        deviceLimit: true,
        netTargetKurus: true,
        paymentAmountKurus: true,
        totalAmountKurus: true,
        paymentType: true,
        currency: true,
        status: true,
        testMode: true,
        paidAt: true,
        createdAt: true,
        checkout: {
          select: {
            name: true,
            email: true,
            deliveryStatus: true,
            deliveryAttempts: true,
            deliverySentAt: true,
            deliveryError: true
          }
        }
      }
    })
  ]);
  return Response.json({
    tamam: true,
    rol: access.actor.role,
    siparisler: orders,
    davetler: invites,
    paytrMakbuzlari: paytrReceipts
  }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
