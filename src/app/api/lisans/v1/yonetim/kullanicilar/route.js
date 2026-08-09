import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { LICENSE_ROLES } from '@/lib/license/policy.mjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Input = z.object({
  email: z.string().email().max(200),
  rol: z.enum(LICENSE_ROLES),
  aktif: z.boolean(),
  gerekce: z.string().trim().min(3).max(1000),
  istekId: z.string().uuid()
}).strict();

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function ownerAccess(request) {
  return authorizeLicenseRequest({
    request,
    action: 'yonetim.kullanici_yonet',
    database: prisma
  });
}

export async function GET(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  const access = await ownerAccess(request);
  if (!access.ok) return json({ error: access.error }, access.status);

  const users = await prisma.adminUser.findMany({
    orderBy: [{ licenseActive: 'desc' }, { email: 'asc' }],
    select: {
      id: true,
      email: true,
      licenseRole: true,
      licenseActive: true,
      licenseMfaEnabled: true,
      licenseLastLoginAt: true,
      licenseRoleChangedAt: true
    }
  });
  return json({
    tamam: true,
    kullanicilar: users.map((user) => ({
      ...user,
      kendisi: user.id === access.actor.id,
      sahip: user.licenseRole === 'sahip'
    }))
  });
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'gecersiz-istek' }, 400);
  const q = parsed.data;
  const access = await ownerAccess(request);
  if (!access.ok) return json({ error: access.error }, access.status);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.adminUser.findUnique({ where: { email: q.email.trim().toLowerCase() } });
      if (!target) return { status: 404, body: { error: 'kullanici-bulunamadi' } };
      if (target.id === access.actor.id || target.licenseRole === 'sahip' || q.rol === 'sahip') {
        return { status: 409, body: { error: 'sahip-hesabi-panelden-degistirilemez' } };
      }
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-user:${target.id}`}))`;
      const fresh = await tx.adminUser.findUnique({ where: { id: target.id } });
      const same = fresh.licenseRole === q.rol && fresh.licenseActive === q.aktif;
      if (same) return { status: 409, body: { error: 'yetki-degismedi' } };

      const now = new Date();
      const updated = await tx.adminUser.update({
        where: { id: fresh.id },
        data: {
          licenseRole: q.rol,
          licenseActive: q.aktif,
          licenseRoleChangedAt: now,
          licenseAuthVersion: { increment: 1 },
          licenseFailedAttempts: 0,
          licenseLockedUntil: null
        }
      });
      await tx.adminSession.updateMany({
        where: { adminId: fresh.id, revokedAt: null },
        data: { revokedAt: now }
      });
      await appendLicenseEvent(tx, {
        licenseId: null,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: 'yonetim.kullanici_yonet',
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: { kullaniciId: fresh.id, rol: fresh.licenseRole, aktif: fresh.licenseActive },
        afterState: { kullaniciId: updated.id, rol: updated.licenseRole, aktif: updated.licenseActive },
        requestId: q.istekId,
        createdAt: now
      });
      return {
        status: 200,
        body: {
          tamam: true,
          kullanici: {
            email: updated.email,
            rol: updated.licenseRole,
            aktif: updated.licenseActive,
            mfaEtkin: updated.licenseMfaEnabled
          },
          istekId: q.istekId
        }
      };
    });
    return json(result.body, result.status);
  } catch (error) {
    if (error?.code === 'P2002') return json({ error: 'istek-tekrarlandi' }, 409);
    return json({ error: 'gecici-hata' }, 503);
  }
}
