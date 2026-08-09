import crypto from 'node:crypto';
import { LICENSE_PROTOCOL } from './contract.mjs';

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
export function licenseNonceHash({ fingerprint, deviceHash, nonce }) {
  return sha256(Buffer.from(
    'hermes-license-nonce/v1\0' + fingerprint + '\0' + deviceHash + '\0' + nonce,
    'utf8'
  ));
}

export function canonicalLicenseResponse(value) {
  const payload = {
    protokol: LICENSE_PROTOCOL,
    lisansParmakIzi: value.lisansParmakIzi,
    uygulama: value.uygulama,
    cihazKimligi: value.cihazKimligi,
    durum: value.durum,
    yetki: {
      seviye: value.yetki.seviye,
      ozellikler: [...value.yetki.ozellikler],
      yetkiSurumu: value.yetki.yetkiSurumu
    },
    sunucuZamani: value.sunucuZamani,
    sonrakiKontrol: value.sonrakiKontrol,
    toleransBitisi: value.toleransBitisi,
    nonce: value.nonce,
    izlemeModu: Boolean(value.izlemeModu),
    gozlenenDurum: value.gozlenenDurum,
    anahtarSurumu: value.anahtarSurumu
  };
  return JSON.stringify(payload);
}

export function decodePrivateKey(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('license-signing-key-missing');
  if (raw.includes('BEGIN PRIVATE KEY')) return raw.replace(/\\n/g, '\n');
  const decoded = Buffer.from(raw, 'base64').toString('utf8');
  if (!decoded.includes('BEGIN PRIVATE KEY')) throw new Error('license-signing-key-invalid');
  return decoded;
}

export function signLicenseResponse(payload, privateKey) {
  const canonical = canonicalLicenseResponse(payload);
  const signature = crypto.sign(null, Buffer.from(canonical, 'utf8'), privateKey).toString('base64');
  return { ...JSON.parse(canonical), imza: signature };
}

export function verifyLicenseResponse(response, publicKey) {
  if (!response || typeof response.imza !== 'string') return false;
  try {
    return crypto.verify(
      null,
      Buffer.from(canonicalLicenseResponse(response), 'utf8'),
      publicKey,
      Buffer.from(response.imza, 'base64')
    );
  } catch {
    return false;
  }
}
