import crypto from 'node:crypto';

export const DESKTOP_PAIRING_MS = 5 * 60 * 1000;

export function desktopPairingSecretHash(id, secret) {
  return crypto.createHash('sha256')
    .update('hermes-license-desktop-pairing/v1\0' + String(id || '') + '\0' + String(secret || ''), 'utf8')
    .digest('hex');
}

export function createDesktopPairingValues(now = new Date()) {
  const id = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('base64url');
  return {
    id,
    secret,
    secretHash: desktopPairingSecretHash(id, secret),
    expiresAt: new Date(now.getTime() + DESKTOP_PAIRING_MS)
  };
}

export function desktopPairingSecretMatches(pairing, secret) {
  const expected = Buffer.from(String(pairing?.secretHash || ''), 'utf8');
  const actual = Buffer.from(desktopPairingSecretHash(pairing?.id, secret), 'utf8');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function desktopPairingUsable(pairing, now = new Date()) {
  return Boolean(pairing && !pairing.claimedAt && new Date(pairing.expiresAt).getTime() > now.getTime());
}
