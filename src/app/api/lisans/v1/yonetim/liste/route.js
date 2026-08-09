import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';

export const dynamic = 'force-dynamic';

function accessResponse(access) {
  return Response.json({ error: access.error }, { status: access.status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const access = await authorizeLicenseRequest({
    request, action: 'lisans.listele', database: prisma
  });
  if (!access.ok) return accessResponse(access);

  const rows = await prisma.license.findMany({
    orderBy: [{ application: 'asc' }, { issuedAt: 'desc' }],
    select: {
      licenseNo: true,
      application: true,
      customerRef: true,
      customerEmail: true,
      status: true,
      statusReason: true,
      statusChangedAt: true,
      suspendedUntil: true,
      issuedAt: true,
      expiresAt: true,
      signedLevel: true,
      signedFeatures: true,
      remoteLevel: true,
      remoteFeatures: true,
      authorizationVersion: true,
      deviceLimit: true,
      monitoringOnly: true,
      aliases: { select: { licenseNo: true }, orderBy: { createdAt: 'asc' } },
      devices: {
        where: { active: true },
        select: { id: true, lastSeenAt: true, lastVerifiedAt: true, lastAppVersion: true }
      }
    }
  });
  return Response.json({ tamam: true, rol: access.actor.role, lisanslar: rows }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
