import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { authorizeLicenseRequest } from '@/lib/license/access.mjs';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { z } from 'zod';

const FEATURES = ['dereceler', 'esmalar', 'analizler', 'ogretmen', 'egitim'];
const Input = z.object({
  lisansNo: z.string().regex(/^[A-Z0-9]{6}\d{10}(?:-\d{2,})?$/),
  parmakIzi: z.string().regex(/^[a-f0-9]{64}$/),
  cihazKimligi: z.string().regex(/^[a-f0-9]{64}$/),
  uygulama: z.enum(['hermes', 'astropen']),
  musteri: z.string().min(2).max(200),
  eposta: z.string().trim().email().max(254).nullable().optional(),
  verilis: z.string().datetime(),
  bitis: z.string().datetime().nullable(),
  seviye: z.enum(['temel', 'tam', 'yonetici']),
  ozellikler: z.array(z.enum(FEATURES)).max(FEATURES.length),
  oncekiLisansNo: z.string().regex(/^[A-Z0-9]{6}\d{10}(?:-\d{2,})?$/).optional(),
  gerekce: z.string().min(3).max(1000),
  istekId: z.string().uuid()
}).strict().refine((value) => new Set(value.ozellikler).size === value.ozellikler.length);

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'gecersiz-istek' }, { status: 400 });
  const q = parsed.data;
  const access = await authorizeLicenseRequest({
    request,
    action: 'lisans.esitle',
    database: prisma,
    reason: q.gerekce
  });
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const now = new Date();
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-sync:${q.parmakIzi}`}))`;
      const same = await tx.license.findFirst({ where: { OR: [{ licenseNo: q.lisansNo }, { fingerprint: q.parmakIzi }] } });
      if (same) {
        if (same.licenseNo === q.lisansNo && same.fingerprint === q.parmakIzi) {
          if (q.eposta && same.customerEmail !== q.eposta) {
            await tx.license.update({ where: { id: same.id }, data: { customerEmail: q.eposta } });
          }
          return { created: false, licenseNo: same.licenseNo, status: same.status };
        }
        throw Object.assign(new Error('license-conflict'), { code: 'CONFLICT' });
      }
      const previous = q.oncekiLisansNo
        ? await tx.license.findUnique({ where: { licenseNo: q.oncekiLisansNo }, include: { devices: true } })
        : null;
      if (q.oncekiLisansNo && !previous) throw Object.assign(new Error('previous-missing'), { code: 'PREVIOUS' });
      if (previous && previous.application !== q.uygulama) throw Object.assign(new Error('previous-app'), { code: 'CONFLICT' });

      const collision = await tx.licenseDevice.findFirst({
        where: {
          deviceHash: q.cihazKimligi,
          active: true,
          license: { application: q.uygulama, ...(previous ? { id: { not: previous.id } } : {}) }
        },
        select: { license: { select: { licenseNo: true } } }
      });
      if (collision) throw Object.assign(new Error('device-conflict'), { code: 'DEVICE' });

      if (previous && previous.status !== 'iptal') {
        await tx.licenseDevice.updateMany({
          where: { licenseId: previous.id, active: true },
          data: { active: false, releasedAt: now }
        });
        await tx.license.update({
          where: { id: previous.id },
          data: {
            status: 'iptal',
            statusReason: `Yeni lisansla değiştirildi: ${q.lisansNo}`,
            statusChangedAt: now,
            suspendedUntil: null,
            permanentlyRevokedAt: now
          }
        });
        await appendLicenseEvent(tx, {
          licenseId: previous.id,
          actorId: access.actor.id,
          actorRole: access.actor.role,
          action: 'lisans.yenileme_ile_degistirildi',
          outcome: 'basarili',
          reason: q.gerekce,
          beforeState: { durum: previous.status, lisansNo: previous.licenseNo },
          afterState: { durum: 'iptal', yeniLisansNo: q.lisansNo },
          requestId: crypto.randomUUID(),
          createdAt: now
        });
      }

      const sourceHash = crypto.createHash('sha256').update(`desktop-sync\0${q.parmakIzi}`).digest('hex');
      const importRow = await tx.licenseImport.create({
        data: {
          sourceHash,
          mode: 'desktop-sync',
          status: 'tamamlandi',
          summary: {
            lisansNo: q.lisansNo,
            oncekiLisansNo: q.oncekiLisansNo || null,
            uygulama: q.uygulama,
            seviye: q.seviye,
            ozellikSayisi: q.ozellikler.length,
            anahtarSaklanmadi: true,
            hamCihazSaklanmadi: true
          },
          createdById: access.actor.id,
          committedAt: now
        }
      });
      const license = await tx.license.create({
        data: {
          licenseNo: q.lisansNo,
          fingerprint: q.parmakIzi,
          application: q.uygulama,
          customerRef: q.musteri,
          customerEmail: q.eposta || null,
          issuedAt: new Date(q.verilis),
          expiresAt: q.bitis ? new Date(q.bitis) : null,
          status: 'aktif',
          statusReason: q.oncekiLisansNo ? 'masaüstü yenileme senkronu' : 'masaüstü yeni lisans senkronu',
          statusChangedAt: now,
          signedLevel: q.seviye,
          signedFeatures: q.ozellikler,
          remoteLevel: q.seviye,
          remoteFeatures: q.ozellikler,
          authorizationVersion: 1,
          deviceLimit: 1,
          monitoringOnly: true,
          sourceImportId: importRow.id,
          devices: { create: [{ deviceHash: q.cihazKimligi, active: true, firstSeenAt: new Date(q.verilis), lastSeenAt: new Date(q.verilis) }] }
        }
      });
      await appendLicenseEvent(tx, {
        licenseId: license.id,
        actorId: access.actor.id,
        actorRole: access.actor.role,
        action: 'lisans.aktar',
        outcome: 'basarili',
        reason: q.gerekce,
        beforeState: q.oncekiLisansNo ? { oncekiLisansNo: q.oncekiLisansNo } : null,
        afterState: { durum: 'aktif', uygulama: q.uygulama, seviye: q.seviye, ozellikSayisi: q.ozellikler.length, izlemeModu: true },
        requestId: q.istekId,
        createdAt: now
      });
      return { created: true, licenseNo: license.licenseNo, status: license.status };
    }, { timeout: 30000 });
    return Response.json({ tamam: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error?.code === 'P2002') return Response.json({ error: 'istek-tekrarlandi' }, { status: 409 });
    if (error?.code === 'PREVIOUS') return Response.json({ error: 'onceki-lisans-bulunamadi' }, { status: 404 });
    if (error?.code === 'DEVICE') return Response.json({ error: 'cihaz-baska-lisansta-etkin' }, { status: 409 });
    if (error?.code === 'CONFLICT') return Response.json({ error: 'lisans-cakismasi' }, { status: 409 });
    return Response.json({ error: 'gecici-hata' }, { status: 503 });
  }
}
