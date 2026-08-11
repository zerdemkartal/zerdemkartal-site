import { z } from 'zod';

export const LICENSE_PROTOCOL = 'hermes-license/v1';
export const LICENSE_APPLICATIONS = Object.freeze(['hermes', 'astropen']);
export const LICENSE_STATUSES = Object.freeze([
  'aktif', 'askida', 'iptal', 'suresi_doldu', 'cihaz_transferi', 'bakim'
]);
export const LICENSE_LEVELS = Object.freeze(['temel', 'tam', 'pro', 'yonetici']);
export const LICENSE_FEATURES = Object.freeze([
  'dereceler', 'esmalar', 'analizler', 'ogretmen', 'egitim'
]);
const LEGACY_LICENSE_FEATURES = Object.freeze(['ai']);
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
export const REQUEST_CLOCK_SKEW_MS = 10 * 60 * 1000;
export const NONCE_TTL_MS = 20 * 60 * 1000;

export const VerificationRequestSchema = z.object({
  protokol: z.literal(LICENSE_PROTOCOL),
  lisansParmakIzi: z.string().regex(/^[0-9a-f]{64}$/),
  uygulama: z.enum(LICENSE_APPLICATIONS),
  cihazKimligi: z.string().regex(/^[0-9a-f]{64}$/),
  uygulamaSurumu: z.string().min(1).max(40).regex(/^[0-9A-Za-z.+_-]+$/),
  istekZamani: z.string().datetime({ offset: true }),
  nonce: z.string().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/)
}).strict();

const LEVEL_RANK = Object.freeze({ temel: 1, tam: 2, pro: 3, yonetici: 4 });

function exactFeatureArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : null;
}

export function effectiveLicenseRights({ signedLevel, signedFeatures, remoteLevel, remoteFeatures }) {
  const signed = exactFeatureArray(signedFeatures);
  const remote = exactFeatureArray(remoteFeatures);
  if (!LEVEL_RANK[signedLevel] || !LEVEL_RANK[remoteLevel]) {
    return { ok: false, reason: 'seviye-taninmiyor' };
  }
  if (!signed || !remote) return { ok: false, reason: 'ozellik-dizisi-gecersiz' };
  if (new Set(signed).size !== signed.length || new Set(remote).size !== remote.length) {
    return { ok: false, reason: 'tekrarli-ozellik' };
  }
  if (signed.some((feature) => !LICENSE_FEATURES.includes(feature) && !LEGACY_LICENSE_FEATURES.includes(feature))) {
    return { ok: false, reason: 'imzali-tavanda-bilinmeyen-ozellik' };
  }
  if (remote.some((feature) => !LICENSE_FEATURES.includes(feature) && !LEGACY_LICENSE_FEATURES.includes(feature))) {
    return { ok: false, reason: 'uzak-yetkide-bilinmeyen-ozellik' };
  }
  if (LEVEL_RANK[remoteLevel] > LEVEL_RANK[signedLevel]) {
    return { ok: false, reason: 'uzak-seviye-tavan-ustu' };
  }
  const signedActive = signed.filter((feature) => LICENSE_FEATURES.includes(feature));
  const remoteActive = remote.filter((feature) => LICENSE_FEATURES.includes(feature));
  const signedSet = new Set(signedActive);
  if (remoteActive.some((feature) => !signedSet.has(feature))) {
    return { ok: false, reason: 'uzak-ozellik-tavan-ustu' };
  }
  return {
    ok: true,
    rights: { seviye: remoteLevel, ozellikler: remoteActive }
  };
}
