import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export const DOWNLOAD_INVITE_MS = 6 * 60 * 60 * 1000;
export const DOWNLOAD_SESSION_MS = 30 * 60 * 1000;
export const DOWNLOAD_LOCK_MS = 15 * 60 * 1000;
export const DOWNLOAD_MAX_FAILURES = 5;
export const DOWNLOAD_SESSION_COOKIE = 'hermes_download_session';

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function randomText(length) {
  const bytes = crypto.randomBytes(length);
  let value = '';
  for (const byte of bytes) value += PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length];
  return value;
}

export function createDownloadPassword() {
  return [4, 4, 4, 4].map(randomText).join('-');
}

export function downloadSecretHash(value, scope = 'link') {
  return crypto.createHash('sha256')
    .update(`hermes-download/${scope}/v1\0${String(value || '')}`, 'utf8')
    .digest('hex');
}

function cleanName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase().slice(0, 254);
}

export async function createDownloadInvite({
  database,
  name,
  email,
  orderId = null,
  application = 'hermes',
  createdByRef = null,
  now = new Date()
}) {
  const recipientName = cleanName(name);
  const recipientEmail = cleanEmail(email);
  if (!recipientName || !recipientEmail) throw new Error('gecersiz-alici');

  const linkToken = crypto.randomBytes(32).toString('base64url');
  const temporaryPassword = createDownloadPassword();
  const linkTokenHash = downloadSecretHash(linkToken, 'link');
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const passwordExpiresAt = new Date(now.getTime() + DOWNLOAD_INVITE_MS);

  const invite = await database.$transaction(async (tx) => {
    const lockKey = `download-invite:${application}:${recipientEmail}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
    await tx.downloadInvite.updateMany({
      where: {
        application,
        revokedAt: null,
        OR: [
          ...(orderId ? [{ orderId }] : []),
          { email: recipientEmail }
        ]
      },
      data: { revokedAt: now }
    });
    return tx.downloadInvite.create({
      data: {
        orderId,
        name: recipientName,
        email: recipientEmail,
        application,
        linkTokenHash,
        passwordHash,
        passwordExpiresAt,
        createdByRef
      }
    });
  }, { timeout: 15000 });

  return { invite, linkToken, temporaryPassword, passwordExpiresAt };
}

export async function markDownloadInviteSent({ database, inviteId, now = new Date() }) {
  return database.downloadInvite.update({
    where: { id: inviteId },
    data: { sentAt: now }
  });
}

export async function revokeDownloadInvite({ database, inviteId, now = new Date() }) {
  return database.$transaction(async (tx) => {
    await tx.downloadSession.updateMany({
      where: { inviteId, revokedAt: null },
      data: { revokedAt: now }
    });
    return tx.downloadInvite.update({
      where: { id: inviteId },
      data: { revokedAt: now }
    });
  });
}

export async function verifyDownloadInvite({ database, linkToken, password, now = new Date() }) {
  const linkTokenHash = downloadSecretHash(linkToken, 'link');
  return database.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`download-auth:${linkTokenHash}`}))`;
    const invite = await tx.downloadInvite.findUnique({ where: { linkTokenHash } });
    if (!invite) return { ok: false, status: 401, reason: 'indirme-erisimi-dogrulanamadi' };
    if (invite.revokedAt) return { ok: false, status: 410, reason: 'indirme-daveti-iptal' };
    if (new Date(invite.passwordExpiresAt).getTime() <= now.getTime()) {
      return { ok: false, status: 410, reason: 'indirme-daveti-suresi-doldu' };
    }
    if (invite.lockedUntil && new Date(invite.lockedUntil).getTime() > now.getTime()) {
      return { ok: false, status: 429, reason: 'indirme-daveti-kilitli' };
    }

    const correct = await bcrypt.compare(String(password || ''), invite.passwordHash);
    if (!correct) {
      const failures = Math.min(DOWNLOAD_MAX_FAILURES, Number(invite.failedAttempts || 0) + 1);
      const lockedUntil = failures >= DOWNLOAD_MAX_FAILURES
        ? new Date(now.getTime() + DOWNLOAD_LOCK_MS)
        : null;
      await tx.downloadInvite.update({
        where: { id: invite.id },
        data: { failedAttempts: failures, lockedUntil }
      });
      return {
        ok: false,
        status: lockedUntil ? 429 : 401,
        reason: lockedUntil ? 'indirme-daveti-kilitli' : 'indirme-erisimi-dogrulanamadi'
      };
    }

    const sessionToken = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + DOWNLOAD_SESSION_MS);
    await tx.downloadInvite.update({
      where: { id: invite.id },
      data: { failedAttempts: 0, lockedUntil: null, openedAt: invite.openedAt || now }
    });
    await tx.downloadSession.create({
      data: {
        inviteId: invite.id,
        tokenHash: downloadSecretHash(sessionToken, 'session'),
        expiresAt
      }
    });
    return { ok: true, sessionToken, expiresAt, inviteId: invite.id };
  }, { timeout: 15000 });
}

export async function findDownloadSession({ database, sessionToken, now = new Date() }) {
  if (!sessionToken) return null;
  const session = await database.downloadSession.findUnique({
    where: { tokenHash: downloadSecretHash(sessionToken, 'session') },
    include: { invite: true }
  });
  if (!session || session.revokedAt || session.invite.revokedAt) return null;
  if (new Date(session.expiresAt).getTime() <= now.getTime()) return null;
  if (new Date(session.invite.passwordExpiresAt).getTime() <= now.getTime()) return null;
  return session;
}
