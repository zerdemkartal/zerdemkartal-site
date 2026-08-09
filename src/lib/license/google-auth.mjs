import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { normalizeAdminEmail, userAgentContext } from './admin-auth.mjs';

export const LICENSE_GOOGLE_CHALLENGE_MS = 5 * 60 * 1000;

export function licenseGoogleClientId(value = process.env.GOOGLE_CLIENT_ID) {
  const clientId = String(value || '').trim();
  if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
    throw new Error('google-client-id-missing');
  }
  return clientId;
}

export function licenseGoogleOwnerEmail(value = process.env.LICENSE_GOOGLE_OWNER_EMAIL) {
  const email = normalizeAdminEmail(value);
  if (!email || !email.endsWith('@gmail.com')) throw new Error('google-owner-email-missing');
  return email;
}

export async function verifyLicenseGoogleCredential({ credential, clientId, verifier }) {
  const ticket = await verifier.verifyIdToken({ idToken: credential, audience: clientId });
  const payload = ticket?.getPayload?.();
  const email = normalizeAdminEmail(payload?.email);
  if (!payload?.sub || !email || payload?.email_verified !== true) {
    throw new Error('google-identity-invalid');
  }
  return { email, googleSub: String(payload.sub) };
}

export function createLicenseGoogleChallenge({ user, googleSub, request, now = new Date(), jwtSecret }) {
  if (!jwtSecret) throw new Error('jwt-secret-missing');
  const expiresAt = new Date(now.getTime() + LICENSE_GOOGLE_CHALLENGE_MS);
  const token = jwt.sign({
    sub: user.email,
    scope: 'license_google_mfa',
    googleSub,
    authVersion: user.licenseAuthVersion,
    userAgentHash: userAgentContext(request).userAgentHash,
    iat: Math.floor(now.getTime() / 1000)
  }, jwtSecret, {
    expiresIn: Math.floor(LICENSE_GOOGLE_CHALLENGE_MS / 1000),
    jwtid: crypto.randomUUID()
  });
  return { challenge: token, expiresAt };
}

function sameHash(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function verifyLicenseGoogleChallenge({ challenge, request, now = new Date(), jwtSecret }) {
  if (!jwtSecret) throw new Error('jwt-secret-missing');
  const payload = jwt.verify(challenge, jwtSecret, { clockTimestamp: Math.floor(now.getTime() / 1000) });
  const currentUserAgentHash = userAgentContext(request).userAgentHash;
  if (
    payload?.scope !== 'license_google_mfa' ||
    !payload?.sub ||
    !payload?.googleSub ||
    !Number.isInteger(payload?.authVersion) ||
    !sameHash(payload?.userAgentHash, currentUserAgentHash)
  ) throw new Error('google-challenge-invalid');
  return payload;
}
