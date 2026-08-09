import crypto from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function base32Encode(input) {
  const bytes = Buffer.from(input);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    result += BASE32[Number.parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  }
  return result;
}

export function base32Decode(value) {
  const clean = String(value || '').toUpperCase().replace(/[\s=-]/g, '');
  if (!clean || [...clean].some((char) => !BASE32.includes(char))) throw new Error('mfa-secret-invalid');
  let bits = '';
  for (const char of clean) bits += BASE32.indexOf(char).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function totpCode({ secret, counter, digits = 6 }) {
  const moving = Buffer.alloc(8);
  moving.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(moving).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const number = (digest.readUInt32BE(offset) & 0x7fffffff) % (10 ** digits);
  return String(number).padStart(digits, '0');
}

function sameToken(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyTotp({ secret, token, now = new Date(), window = 1, lastCounter = null }) {
  if (!/^\d{6}$/.test(String(token || ''))) return null;
  const current = Math.floor(now.getTime() / 30000);
  const previous = lastCounter === null || lastCounter === undefined ? null : BigInt(lastCounter);
  for (let drift = -window; drift <= window; drift++) {
    const counter = BigInt(current + drift);
    if (counter < 0n || (previous !== null && counter <= previous)) continue;
    if (sameToken(totpCode({ secret, counter }), token)) return counter;
  }
  return null;
}

export function totpAuthUri({ secret, email, issuer = 'Hermes Lisans' }) {
  const label = encodeURIComponent(`${issuer}:${String(email).toLowerCase()}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function decodeMfaEncryptionKey(value) {
  const key = Buffer.from(String(value || '').trim(), 'base64');
  if (key.length !== 32) throw new Error('mfa-encryption-key-invalid');
  return key;
}

export function encryptMfaSecret(secret, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('hermes-license-mfa/v1', 'utf8'));
  const encrypted = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptMfaSecret(value, key) {
  const [version, ivRaw, tagRaw, encryptedRaw, extra] = String(value || '').split('.');
  if (version !== 'v1' || !ivRaw || !tagRaw || !encryptedRaw || extra) throw new Error('mfa-cipher-invalid');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivRaw, 'base64url'));
  decipher.setAAD(Buffer.from('hermes-license-mfa/v1', 'utf8'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

export function normalizeRecoveryCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function recoveryCodeHash(value) {
  return crypto.createHash('sha256')
    .update('hermes-license-recovery/v1\0' + normalizeRecoveryCode(value), 'utf8')
    .digest('hex');
}

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => {
    let raw = '';
    for (let i = 0; i < 12; i++) raw += RECOVERY_ALPHABET[crypto.randomInt(RECOVERY_ALPHABET.length)];
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
  });
}

export function consumeRecoveryCode(value, storedHashes) {
  if (!Array.isArray(storedHashes) || !normalizeRecoveryCode(value)) return { ok: false, remaining: storedHashes || [] };
  const hash = recoveryCodeHash(value);
  const index = storedHashes.findIndex((item) => sameToken(item, hash));
  if (index < 0) return { ok: false, remaining: storedHashes };
  return { ok: true, remaining: storedHashes.filter((_, i) => i !== index) };
}
