import { prisma } from '@/lib/db';
import {
  LICENSE_DESKTOP_SESSION_MS,
  createLicenseSession,
  licenseAccountUsable
} from '@/lib/license/admin-auth.mjs';
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
  const now = new Date();
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`desktop-pairing:${parsed.data.eslestirmeId}`}))`;
      const pairing = await tx.desktopPairing.findUnique({
        where: { id: parsed.data.eslestirmeId },
        include: { approvedBy: true }
      });
      if (!desktopPairingUsable(pairing, now) || !desktopPairingSecretMatches(pairing, parsed.data.eslestirmeSirri)) {
        throw new Error('pairing-invalid');
      }
      if (!pairing.approvedAt || !pairing.approvedBy) return { bekliyor: true };
      if (!licenseAccountUsable(pairing.approvedBy, now) || !pairing.approvedBy.licenseMfaEnabled) {
        throw new Error('pairing-invalid');
      }
      const session = await createLicenseSession({
        tx,
        user: pairing.approvedBy,
        request,
        now,
        jwtSecret: process.env.JWT_SECRET,
        durationMs: LICENSE_DESKTOP_SESSION_MS,
        contextType: 'kripto-yonetimi'
      });
      await tx.desktopPairing.update({ where: { id: pairing.id }, data: { claimedAt: now } });
      return { bekliyor: false, ...session, role: pairing.approvedBy.licenseRole };
    });
    return Response.json(result.bekliyor ? { tamam: false, durum: 'bekliyor' } : { tamam: true, ...result }, {
      status: result.bekliyor ? 202 : 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch {
    return Response.json({ error: 'masaustu-eslestirmesi-gecersiz' }, { status: 410 });
  }
}
