import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { desktopPairingSecretMatches, desktopPairingUsable } from '@/lib/license/desktop-pairing.mjs';
import { z } from 'zod';

const Input = z.object({
  eslestirmeId: z.string().uuid(),
  eslestirmeSirri: z.string().min(40).max(100)
}).strict();

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'gecersiz-istek' }, { status: 400 });
  const access = await authorizeLicenseRequest({
    request,
    action: 'yonetim.masaustu_bagla',
    database: prisma
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`desktop-pairing:${parsed.data.eslestirmeId}`}))`;
      const pairing = await tx.desktopPairing.findUnique({ where: { id: parsed.data.eslestirmeId } });
      if (!desktopPairingUsable(pairing, now) || !desktopPairingSecretMatches(pairing, parsed.data.eslestirmeSirri)) {
        throw new Error('pairing-invalid');
      }
      if (pairing.approvedById && pairing.approvedById !== access.actor.id) throw new Error('pairing-invalid');
      await tx.desktopPairing.update({
        where: { id: pairing.id },
        data: { approvedById: access.actor.id, approvedAt: now }
      });
    });
    return Response.json({ tamam: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'masaustu-eslestirmesi-gecersiz' }, { status: 409 });
  }
}
