import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const access = await authorizeLicenseRequest({
    request, action: 'lisans.listele', database: prisma
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  await prisma.adminSession.update({
    where: { id: access.sessionId }, data: { revokedAt: new Date() }
  });
  return Response.json({ tamam: true }, { headers: { 'Cache-Control': 'no-store' } });
}
