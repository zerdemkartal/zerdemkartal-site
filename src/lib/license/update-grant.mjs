import jwt from 'jsonwebtoken';

export const UPDATE_GRANT_MS = 25 * 60 * 60 * 1000;
const AUDIENCE = 'hermes-private-updater';

export function issueUpdateGrant({ fingerprint, application, deviceHash, secret, now = new Date() }) {
  if (!secret) throw new Error('jwt-secret-missing');
  return jwt.sign({ app: application, device: deviceHash }, secret, {
    subject: fingerprint,
    audience: AUDIENCE,
    expiresIn: Math.floor(UPDATE_GRANT_MS / 1000)
  });
}

export function verifyUpdateGrant(token, secret) {
  const claims = jwt.verify(String(token || ''), secret, { audience: AUDIENCE });
  if (!claims?.sub || !claims?.app || !claims?.device) throw new Error('update-grant-invalid');
  return { fingerprint: claims.sub, application: claims.app, deviceHash: claims.device };
}
