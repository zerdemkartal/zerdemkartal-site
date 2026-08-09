import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { appendLicenseEvent } from '@/lib/license/events.mjs';
import { decodePrivateKey } from '@/lib/license/protocol.mjs';
import { verifyLicenseRequest } from '@/lib/license/service.mjs';
import { issueUpdateGrant } from '@/lib/license/update-grant.mjs';

export const dynamic = 'force-dynamic';

function disabled() {
  return Response.json(
    { tamam: false, error: 'lisans-servisi-hazirlikta' },
    { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '3600' } }
  );
}

function prismaRepository(tx) {
  return {
    findLicense(fingerprint, application) {
      return tx.license.findFirst({ where: { fingerprint, application } });
    },
    async consumeNonce({ licenseId, nonceHash, deviceHash, expiresAt }) {
      try {
        await tx.licenseNonce.create({ data: { licenseId, nonceHash, deviceHash, expiresAt } });
        return true;
      } catch (error) {
        if (error && error.code === 'P2002') return false;
        throw error;
      }
    },
    async bindDevice({ license, deviceHash, appVersion, now }) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license:${license.id}`}))`;
      const currentLicense = await tx.license.findUnique({ where: { id: license.id } });
      if (!currentLicense) return { allowed: false, deviceId: null };
      let suspensionCompleted = false;
      if (currentLicense.status === 'askida' && currentLicense.suspendedUntil &&
          new Date(currentLicense.suspendedUntil).getTime() <= now.getTime()) {
        await tx.license.update({
          where: { id: currentLicense.id },
          data: {
            status: 'aktif',
            statusReason: 'aski-suresi-doldu',
            statusChangedAt: now,
            suspendedUntil: null
          }
        });
        await appendLicenseEvent(tx, {
          licenseId: currentLicense.id,
          action: 'lisans.aski_suresi_doldu',
          outcome: 'basarili',
          reason: 'aski-suresi-doldu',
          beforeState: { durum: 'askida', askiBitisi: currentLicense.suspendedUntil },
          afterState: { durum: 'aktif', askiBitisi: null },
          requestId: crypto.randomUUID(),
          createdAt: now
        });
        currentLicense.status = 'aktif';
        currentLicense.suspendedUntil = null;
        suspensionCompleted = true;
      }
      const completeTransfer = async () => {
        if (currentLicense.status !== 'cihaz_transferi') return false;
        await tx.license.update({
          where: { id: currentLicense.id },
          data: {
            status: 'aktif',
            statusReason: 'yeni-cihaz-dogrulandi',
            statusChangedAt: now,
            suspendedUntil: null
          }
        });
        await appendLicenseEvent(tx, {
          licenseId: currentLicense.id,
          action: 'lisans.cihaz_transferi_tamamlandi',
          outcome: 'basarili',
          reason: 'yeni-cihaz-dogrulandi',
          beforeState: { durum: 'cihaz_transferi' },
          afterState: { durum: 'aktif', etkinCihazSayisi: 1 },
          requestId: crypto.randomUUID(),
          createdAt: now
        });
        return true;
      };
      const where = { licenseId_deviceHash: { licenseId: license.id, deviceHash } };
      const existing = await tx.licenseDevice.findUnique({ where });
      if (existing) {
        if (!existing.active) {
          if (currentLicense.status !== 'cihaz_transferi') return { allowed: false, deviceId: null };
          const activeCount = await tx.licenseDevice.count({
            where: { licenseId: license.id, active: true }
          });
          if (activeCount >= currentLicense.deviceLimit) return { allowed: false, deviceId: null };
          const rebound = await tx.licenseDevice.update({
            where,
            data: {
              active: true,
              releasedAt: null,
              lastSeenAt: now,
              lastVerifiedAt: now,
              lastAppVersion: appVersion
            }
          });
          return {
            allowed: true,
            deviceId: rebound.id,
            transferCompleted: await completeTransfer(),
            suspensionCompleted
          };
        }
        const updated = await tx.licenseDevice.update({
          where,
          data: { lastSeenAt: now, lastVerifiedAt: now, lastAppVersion: appVersion }
        });
        return { allowed: true, deviceId: updated.id, transferCompleted: false, suspensionCompleted };
      }
      const activeCount = await tx.licenseDevice.count({ where: { licenseId: license.id, active: true } });
      if (activeCount >= currentLicense.deviceLimit) return { allowed: false, deviceId: null };
      const created = await tx.licenseDevice.create({
        data: {
          licenseId: license.id,
          deviceHash,
          active: true,
          firstSeenAt: now,
          lastSeenAt: now,
          lastVerifiedAt: now,
          lastAppVersion: appVersion
        }
      });
      return {
        allowed: true,
        deviceId: created.id,
        transferCompleted: await completeTransfer(),
        suspensionCompleted
      };
    },
    saveLease(data) {
      const create = { ...data };
      const update = { ...data };
      delete create.deviceId;
      delete update.deviceId;
      return tx.licenseLease.upsert({
        where: { deviceId: data.deviceId },
        create: { deviceId: data.deviceId, ...create },
        update
      });
    },
    async recordSecurityEvent({ licenseId, reason, now }) {
      const requestId = crypto.randomUUID();
      await appendLicenseEvent(tx, {
        licenseId,
        action: 'dogrulama',
        outcome: 'reddedildi',
        reason,
        requestId,
        createdAt: now
      });
    }
  };
}

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') return disabled();
  const raw = await request.json().catch(() => null);
  let privateKey;
  try { privateKey = decodePrivateKey(process.env.LICENSE_STATUS_PRIVATE_KEY_B64); }
  catch { return disabled(); }
  const keyVersion = Number(process.env.LICENSE_STATUS_KEY_VERSION || 1);
  if (!Number.isInteger(keyVersion) || keyVersion < 1) return disabled();

  try {
    const result = await prisma.$transaction(async (tx) => verifyLicenseRequest({
      raw,
      repository: prismaRepository(tx),
      privateKey,
      keyVersion,
      enforcementEnabled: process.env.LICENSE_V1_ENFORCEMENT === '1',
      now: new Date()
    }));
    const body = result.status === 200 ? {
      ...result.body,
      guncellemeBelirteci: issueUpdateGrant({
        fingerprint: result.body.lisansParmakIzi,
        application: result.body.uygulama,
        deviceHash: result.body.cihazKimligi,
        secret: process.env.JWT_SECRET
      })
    } : result.body;
    return Response.json(body, { status: result.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { tamam: false, error: 'lisans-servisi-gecici-hata' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' } }
    );
  }
}
