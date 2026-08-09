import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { licenseSessionTokenHash } from './access.mjs';
import {
  consumeRecoveryCode,
  decodeMfaEncryptionKey,
  decryptMfaSecret,
  verifyTotp
} from './mfa.mjs';

export const LICENSE_SESSION_MS = 30 * 60 * 1000;
export const LICENSE_DESKTOP_SESSION_MS = 16 * 60 * 60 * 1000;
export const LICENSE_REAUTH_MS = 10 * 60 * 1000;
export const LICENSE_MFA_ENROLLMENT_MS = 10 * 60 * 1000;
export const LICENSE_AUTH_LOCK_MS = 15 * 60 * 1000;
export const LICENSE_AUTH_MAX_FAILURES = 5;

const DUMMY_PASSWORD_HASH = '$2a$10$SArSfrraR5l.4dwPiphHTu332rsGgZn96zMyMg14bYRDtCzs09eT6';

export function normalizeAdminEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function licenseMfaKey(value = process.env.LICENSE_MFA_ENCRYPTION_KEY_B64) {
  return decodeMfaEncryptionKey(value);
}

export async function passwordMatches(user, password) {
  return bcrypt.compare(String(password || ''), user?.passHash || DUMMY_PASSWORD_HASH);
}

export function userAgentContext(request, type = 'web') {
  const value = request?.headers?.get?.('user-agent') || '';
  return {
    type,
    userAgentHash: crypto.createHash('sha256')
      .update('hermes-license-user-agent/v1\0' + value, 'utf8')
      .digest('hex')
  };
}

export function verifySecondFactor({ user, code, recoveryCode, key, now = new Date() }) {
  if (recoveryCode) {
    const consumed = consumeRecoveryCode(recoveryCode, user.licenseMfaRecoveryHashes);
    return consumed.ok ? { ok: true, method: 'recovery', recoveryHashes: consumed.remaining } : { ok: false };
  }
  if (!user.licenseMfaSecretCipher) return { ok: false };
  try {
    const secret = decryptMfaSecret(user.licenseMfaSecretCipher, key);
    const counter = verifyTotp({ secret, token: code, now, lastCounter: user.licenseMfaLastCounter });
    return counter === null ? { ok: false } : { ok: true, method: 'totp', counter };
  } catch {
    return { ok: false };
  }
}

export async function recordAuthFailure(database, userId, now = new Date()) {
  if (!userId) return;
  await database.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-auth:${userId}`}))`;
    const user = await tx.adminUser.findUnique({
      where: { id: userId }, select: { licenseFailedAttempts: true }
    });
    if (!user) return;
    const count = user.licenseFailedAttempts + 1;
    await tx.adminUser.update({
      where: { id: userId },
      data: {
        licenseFailedAttempts: count,
        licenseLockedUntil: count >= LICENSE_AUTH_MAX_FAILURES
          ? new Date(now.getTime() + LICENSE_AUTH_LOCK_MS)
          : undefined
      }
    });
  });
}

export function licenseAccountUsable(user, now = new Date()) {
  return Boolean(
    user && user.licenseActive && user.licenseRole &&
    (!user.licenseLockedUntil || new Date(user.licenseLockedUntil).getTime() <= now.getTime())
  );
}

export async function createLicenseSession({
  tx,
  user,
  request,
  now = new Date(),
  jwtSecret,
  durationMs = LICENSE_SESSION_MS,
  contextType = 'web'
}) {
  if (!jwtSecret) throw new Error('jwt-secret-missing');
  if (!Number.isFinite(durationMs) || durationMs < 5 * 60 * 1000 || durationMs > LICENSE_DESKTOP_SESSION_MS) {
    throw new Error('session-duration-invalid');
  }
  const id = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + durationMs);
  const token = jwt.sign({
    sub: user.email,
    role: 'license_admin',
    jti: id,
    authVersion: user.licenseAuthVersion
  }, jwtSecret, { expiresIn: Math.floor(durationMs / 1000) });
  await tx.adminSession.create({
    data: {
      id,
      adminId: user.id,
      tokenHash: licenseSessionTokenHash(token),
      authVersion: user.licenseAuthVersion,
      mfaVerifiedAt: now,
      reauthenticatedAt: now,
      expiresAt,
      lastSeenAt: now,
      context: userAgentContext(request, contextType)
    }
  });
  return { token, expiresAt };
}

export function secondFactorUpdate(result) {
  if (result.method === 'recovery') {
    return { licenseMfaRecoveryHashes: result.recoveryHashes };
  }
  return { licenseMfaLastCounter: result.counter };
}
