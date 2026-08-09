import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const access = await authorizeLicenseRequest({
    request, action: 'lisans.gecmis', database: prisma
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

  const licenseNo = new URL(request.url).searchParams.get('lisansNo') || '';
  if (!/^[A-Z0-9-]{16,32}$/.test(licenseNo)) {
    return Response.json({ error: 'gecersiz-istek' }, { status: 400 });
  }
  const license = await prisma.license.findFirst({
    where: { OR: [{ licenseNo }, { aliases: { some: { licenseNo } } }] },
    select: { id: true, licenseNo: true }
  });
  if (!license) return Response.json({ error: 'kayit-bulunamadi' }, { status: 404 });
  const events = await prisma.licenseEvent.findMany({
    where: { licenseId: license.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      action: true, outcome: true, reason: true, beforeState: true, afterState: true,
      actorRole: true, requestId: true, eventHash: true, previousHash: true, createdAt: true
    }
  });
  return Response.json({ tamam: true, lisansNo: license.licenseNo, olaylar: events }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
