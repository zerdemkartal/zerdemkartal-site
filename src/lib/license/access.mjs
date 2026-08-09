import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { licenseAuthorizationDecision } from './policy.mjs';

export function licenseSessionTokenHash(token) {
  return crypto.createHash('sha256')
    .update('hermes-admin-session/v1\0' + String(token || ''), 'utf8')
    .digest('hex');
}

function bearerToken(request) {
  const header = request?.headers?.get?.('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function sameHash(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function reject(status = 403) {
  return { ok: false, status, error: status === 401 ? 'unauthorized' : 'forbidden' };
}

// Lisans yönetim route'ları bu kapıyı her istekte çağırır. JWT içindeki role güvenilmez;
// kullanıcı rolü, auth sürümü, oturum iptali ve MFA durumu veritabanından yeniden okunur.
// Uzun ömürlü genel ADMIN_TOKEN burada özellikle kabul edilmez.
export async function authorizeLicenseRequest({
  request,
  action,
  database,
  now = new Date(),
  reason,
  suspensionDays,
  licenseNo,
  licenseNoConfirmation,
  jwtSecret = process.env.JWT_SECRET
}) {
  const token = bearerToken(request);
  if (!token || !jwtSecret) return reject(401);

  let claims;
  try { claims = jwt.verify(token, jwtSecret); }
  catch { return reject(401); }
  if (!claims?.sub || !claims?.jti) return reject(401);

  const user = await database.adminUser.findUnique({
    where: { email: claims.sub },
    select: {
      id: true,
      email: true,
      licenseRole: true,
      licenseActive: true,
      licenseMfaEnabled: true,
      licenseAuthVersion: true
    }
  });
  if (!user || !user.licenseActive || !user.licenseRole) return reject();

  const session = await database.adminSession.findUnique({ where: { id: claims.jti } });
  const sessionValid = Boolean(
    session &&
    session.adminId === user.id &&
    !session.revokedAt &&
    new Date(session.expiresAt).getTime() > now.getTime() &&
    session.authVersion === user.licenseAuthVersion &&
    sameHash(session.tokenHash, licenseSessionTokenHash(token))
  );
  const mfaVerified = Boolean(user.licenseMfaEnabled && session?.mfaVerifiedAt);
  const reauthenticated = Boolean(
    session?.reauthenticatedAt &&
    now.getTime() - new Date(session.reauthenticatedAt).getTime() >= 0 &&
    now.getTime() - new Date(session.reauthenticatedAt).getTime() <= 10 * 60 * 1000
  );
  const decision = licenseAuthorizationDecision({
    role: user.licenseRole,
    action,
    sessionValid,
    mfaVerified,
    reason,
    suspensionDays,
    reauthenticated,
    licenseNo,
    licenseNoConfirmation
  });
  if (!decision.allowed) return reject();

  await database.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: now }
  });
  return {
    ok: true,
    actor: { id: user.id, email: user.email, role: user.licenseRole },
    sessionId: session.id
  };
}
