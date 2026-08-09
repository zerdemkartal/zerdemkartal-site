import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { LICENSE_FEATURES, LICENSE_LEVELS, effectiveLicenseRights } from '@/lib/license/contract.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

const Input = z.object({
  lisansNo: z.string().regex(/^[A-Z0-9]{6}\d{10}(?:-\d{2,})?$/),
  seviye: z.enum(LICENSE_LEVELS),
  ozellikler: z.array(z.enum(LICENSE_FEATURES)).max(LICENSE_FEATURES.length),
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
    action: 'lisans.yetki_azalt',
    database: prisma,
    reason: q.gerekce,
    licenseNo: q.lisansNo
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const found = await tx.license.findFirst({
        where: { OR: [{ licenseNo: q.lisansNo }, { aliases: { some: { licenseNo: q.lisansNo } } }] }
      });
      if (!found) return { status: 404, body: { error: 'kayit-bulunamadi' } };
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license:${found.id}`}))`;
      const license = await tx.license.findUnique({ where: { id: found.id } });
      if (!license || license.status === 'iptal') {
        return { status: 409, body: { error: 'yetki-degisikligi-reddedildi' } };
      }
      const rights = effectiveLicenseRights({
        signedLevel: license.signedLevel,
        signedFeatures: license.signedFeatures,
        remoteLevel: q.seviye,
        remoteFeatures: q.ozellikler
      });
      if (!rights.ok) return { status: 409, body: { error: 'yetki-tavan-ustu' } };
      const before = { seviye: license.remoteLevel, ozellikler: license.remoteFeatures };
      const same = before.seviye === rights.rights.seviye &&
        JSON.stringify(before.ozellikler) === JSON.stringify(rights.rights.ozellikler);
      if (same) return { status: 409, body: { error: 'yetki-degismedi' } };
      const updated = await tx.license.update({
        where: { id: license.id },
        data: {
          remoteLevel: rights.rights.seviye,
          remoteFeatures: rights.rights.ozellikler,
          authorizationVersion: { increment: 1 }
        }
      });
      const now = new Date();
      await appendLicenseEvent(tx, {
        licenseId: license.id,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: 'lisans.yetki_azalt',
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: { ...before, yetkiSurumu: license.authorizationVersion },
        afterState: {
          seviye: updated.remoteLevel,
          ozellikler: updated.remoteFeatures,
          yetkiSurumu: updated.authorizationVersion
        },
        requestId: q.istekId,
        createdAt: now
      });
      return {
        status: 200,
        body: {
          tamam: true,
          lisansNo: license.licenseNo,
          yetki: {
            seviye: updated.remoteLevel,
            ozellikler: updated.remoteFeatures,
            yetkiSurumu: updated.authorizationVersion
          },
          istekId: q.istekId
        }
      };
    });
    return Response.json(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error?.code === 'P2002') return Response.json({ error: 'istek-tekrarlandi' }, { status: 409 });
    return Response.json({ error: 'gecici-hata' }, { status: 503 });
  }
}
