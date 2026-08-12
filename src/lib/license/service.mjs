import {
  CHECK_INTERVAL_MS,
  LICENSE_PROTOCOL,
  NONCE_TTL_MS,
  OFFLINE_GRACE_MS,
  REQUEST_CLOCK_SKEW_MS,
  VerificationRequestSchema,
  effectiveLicenseRights
} from './contract.mjs';
import {
  canonicalLicenseResponse,
  licenseNonceHash,
  sha256,
  signLicenseResponse
} from './protocol.mjs';

function jsonError(status, error) {
  return { status, body: { tamam: false, error } };
}

function iso(date) { return date.toISOString(); }
function addMs(date, ms) { return new Date(date.getTime() + ms); }

/* Hermes 1.7.7–1.7.9, Pro/Yönetici kapsamındaki Analizlerim hakkını ayrı bir
   özellik bayrağından değil lisans seviyesinden açar. Bu sürümlere `analizler`
   bayrağını yeniden göndermek eski istemcinin çevrimdışı imzalı tavan kontrolünü
   düşürür ve güncelleme belirtecine ulaşmasını engeller. Yalnız imzalanacak yanıtı
   uyumlu hâle getir; veritabanındaki yetkiyi veya diğer istemcileri değiştirme. */
export function desktopCompatibleRights({ application, applicationVersion, rights }) {
  const current = rights && typeof rights === 'object' ? rights : { seviye: '', ozellikler: [] };
  const features = Array.isArray(current.ozellikler) ? current.ozellikler : [];
  const legacyLevelBasedHermes = application === 'hermes' && /^1\.7\.(7|8|9)$/.test(String(applicationVersion || ''));
  if (!legacyLevelBasedHermes || !features.includes('analizler')) return current;
  return { ...current, ozellikler: features.filter((feature) => feature !== 'analizler') };
}

export async function verifyLicenseRequest({
  raw,
  repository,
  now = new Date(),
  privateKey,
  keyVersion = 1,
  enforcementEnabled = false
}) {
  const parsed = VerificationRequestSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, 'gecersiz-istek');
  const request = parsed.data;
  const requestTime = new Date(request.istekZamani);
  if (Math.abs(now.getTime() - requestTime.getTime()) > REQUEST_CLOCK_SKEW_MS) {
    return jsonError(400, 'gecersiz-istek');
  }

  const license = await repository.findLicense(request.lisansParmakIzi, request.uygulama);
  if (!license) return jsonError(404, 'lisans-dogrulanamadi');

  const nonceHash = licenseNonceHash({
    fingerprint: request.lisansParmakIzi,
    deviceHash: request.cihazKimligi,
    nonce: request.nonce
  });
  const nonceAccepted = await repository.consumeNonce({
    licenseId: license.id,
    nonceHash,
    deviceHash: request.cihazKimligi,
    now,
    expiresAt: addMs(now, NONCE_TTL_MS)
  });
  if (!nonceAccepted) return jsonError(409, 'istek-tekrarlandi');

  const rightsResult = effectiveLicenseRights({
    signedLevel: license.signedLevel,
    signedFeatures: license.signedFeatures,
    remoteLevel: license.remoteLevel,
    remoteFeatures: license.remoteFeatures
  });
  if (!rightsResult.ok) {
    if (repository.recordSecurityEvent) {
      await repository.recordSecurityEvent({ licenseId: license.id, reason: rightsResult.reason, now });
    }
    return jsonError(409, 'lisans-dogrulanamadi');
  }

  const device = await repository.bindDevice({
    license,
    deviceHash: request.cihazKimligi,
    appVersion: request.uygulamaSurumu,
    now
  });

  let observedStatus = device.transferCompleted || device.suspensionCompleted ? 'aktif' : license.status;
  if (license.expiresAt && new Date(license.expiresAt).getTime() < now.getTime()) observedStatus = 'suresi_doldu';
  if (!device.allowed) observedStatus = 'cihaz_transferi';

  // Canlı yaptırım iki ayrı açık karar ister: ortam kapısı + lisans kaydı.
  const monitoring = !enforcementEnabled || license.monitoringOnly !== false;
  const effectiveStatus = monitoring ? 'aktif' : observedStatus;
  const accessContinues = effectiveStatus === 'aktif' || effectiveStatus === 'bakim';
  const nextCheckAt = accessContinues ? addMs(now, CHECK_INTERVAL_MS) : new Date(now);
  const graceUntil = accessContinues ? addMs(now, OFFLINE_GRACE_MS) : new Date(now);
  const responseRights = desktopCompatibleRights({
    application: request.uygulama,
    applicationVersion: request.uygulamaSurumu,
    rights: rightsResult.rights
  });
  const payload = {
    protokol: LICENSE_PROTOCOL,
    lisansParmakIzi: request.lisansParmakIzi,
    uygulama: request.uygulama,
    cihazKimligi: request.cihazKimligi,
    durum: effectiveStatus,
    yetki: {
      ...responseRights,
      yetkiSurumu: license.authorizationVersion
    },
    sunucuZamani: iso(now),
    sonrakiKontrol: iso(nextCheckAt),
    toleransBitisi: iso(graceUntil),
    nonce: request.nonce,
    izlemeModu: monitoring,
    gozlenenDurum: observedStatus,
    anahtarSurumu: keyVersion
  };
  const signed = signLicenseResponse(payload, privateKey);

  if (device.deviceId) {
    await repository.saveLease({
      deviceId: device.deviceId,
      status: effectiveStatus,
      rights: signed.yetki,
      serverTime: now,
      nextCheckAt,
      graceUntil,
      nonceHash,
      responseHash: sha256(Buffer.from(canonicalLicenseResponse(signed), 'utf8')),
      keyVersion
    });
  }
  return { status: 200, body: signed };
}
