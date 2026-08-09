import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export const CUSTOMER_SETUP_MS = 72 * 60 * 60 * 1000;
export const CUSTOMER_SESSION_MS = 30 * 60 * 1000;
export const CUSTOMER_LOCK_MS = 15 * 60 * 1000;
export const CUSTOMER_MAX_FAILURES = 5;
export const CUSTOMER_SESSION_COOKIE = 'hermes_license_session';

const DUMMY_PASSWORD_HASH = '$2a$12$KIYlw.bVE6ixAf92wNbqsuh.PVhydsUsxA..Fgar8lVI3oFPe4YYC';
const TURKISH_ASCII = {
  Ç: 'C', Ğ: 'G', İ: 'I', I: 'I', Ö: 'O', Ş: 'S', Ü: 'U',
  ç: 'C', ğ: 'G', ı: 'I', i: 'I', ö: 'O', ş: 'S', ü: 'U'
};

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function createSecretToken() {
  return crypto.randomBytes(32).toString('base64url');
}

const TEMPORARY_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

// E-postaya yalniz bir kez konur. Ad, tarih veya lisans numarasindan turetilmez;
// Neon'a ham deger degil yalniz bcrypt ozeti yazilir.
export function createTemporaryPassword() {
  const groups = [];
  for (let group = 0; group < 4; group += 1) {
    let value = '';
    for (let index = 0; index < 4; index += 1) {
      value += TEMPORARY_PASSWORD_ALPHABET[crypto.randomInt(TEMPORARY_PASSWORD_ALPHABET.length)];
    }
    groups.push(value);
  }
  return groups.join('-');
}

export function normalizeLicenseNo(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function asciiName(value) {
  return String(value || '')
    .replace(/[ÇĞİIÖŞÜçğıiöşü]/g, (letter) => TURKISH_ASCII[letter] || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

export function customerNameParts(value) {
  const parts = asciiName(value).split(/\s+/).filter(Boolean);
  const first = parts[0] || 'MUS';
  const last = parts.length > 1 ? parts[parts.length - 1] : first;
  return { first, last };
}

function three(value) {
  return String(value || '').slice(0, 3).padEnd(3, 'X');
}

function istanbulParts(date) {
  const pieces = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(pieces.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

// Kullanıcının istediği biçim: AD3 + SOYAD3 + GGAAYYSSDD (İstanbul saati).
export function licenseNumberFor({ name, now = new Date(), collision = 0 }) {
  const person = customerNameParts(name);
  const time = istanbulParts(now);
  const base = `${three(person.first)}${three(person.last)}${time.day}${time.month}${time.year}${time.hour}${time.minute}`;
  return collision > 0 ? `${base}-${String(collision + 1).padStart(2, '0')}` : base;
}

async function availableLicenseNumber(tx, name, now) {
  for (let collision = 0; collision < 99; collision += 1) {
    const candidate = licenseNumberFor({ name, now, collision });
    const [usedCredential, usedOrder] = await Promise.all([
      tx.customerLicenseCredential.findUnique({ where: { licenseNo: candidate }, select: { id: true } }),
      tx.order.findUnique({ where: { license: candidate }, select: { id: true } })
    ]);
    if (!usedCredential && !usedOrder) return candidate;
  }
  throw new Error('lisans-numarasi-ayrilamadi');
}

export async function preparePaidCustomerAccess({ database, orderId, payProvider, payRef, now = new Date() }) {
  const temporaryPassword = createTemporaryPassword();
  const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 12);
  const temporaryPasswordExpiresAt = new Date(now.getTime() + CUSTOMER_SETUP_MS);

  return database.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`customer-license:${orderId}`}))`;
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { customerAccess: true }
    });
    if (!order) throw new Error('siparis-bulunamadi');
    if (order.status === 'cancelled') throw new Error('iptal-edilmis-siparis');

    let credential = order.customerAccess;
    let rawTemporaryPassword = null;
    if (!credential) {
      const licenseNo = await availableLicenseNumber(tx, order.name, now);
      credential = await tx.customerLicenseCredential.create({
        data: {
          orderId: order.id,
          licenseNo,
          application: /astropen/i.test(String(order.product || '')) ? 'astropen' : 'hermes',
          email: String(order.email || '').trim().toLowerCase(),
          passwordHash: temporaryPasswordHash,
          passwordTemporary: true,
          temporaryPasswordExpiresAt
        }
      });
      rawTemporaryPassword = temporaryPassword;
    } else if (!order.paymentEmailSentAt && (!credential.passwordHash || credential.passwordTemporary)) {
      credential = await tx.customerLicenseCredential.update({
        where: { id: credential.id },
        data: {
          passwordHash: temporaryPasswordHash,
          passwordTemporary: true,
          temporaryPasswordExpiresAt,
          setupTokenHash: null,
          setupExpiresAt: null,
          setupUsedAt: null,
          failedAttempts: 0,
          lockedUntil: null,
          authVersion: { increment: 1 }
        }
      });
      rawTemporaryPassword = temporaryPassword;
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: order.status === 'delivered' ? 'delivered' : 'paid',
        payProvider: payProvider || order.payProvider,
        payRef: payRef || order.payRef,
        paidAt: order.paidAt || now,
        license: credential.licenseNo
      }
    });

    return {
      order: updatedOrder,
      credential,
      shouldSendEmail: !order.paymentEmailSentAt,
      temporaryPassword: rawTemporaryPassword,
      temporaryPasswordExpiresAt: rawTemporaryPassword ? temporaryPasswordExpiresAt : null
    };
  }, { timeout: 15000 });
}

export async function markPaymentEmailSent({ database, orderId, now = new Date() }) {
  return database.order.update({
    where: { id: orderId },
    data: { paymentEmailSentAt: now }
  });
}

export async function setCustomerPassword({ database, token, password, now = new Date() }) {
  const setupTokenHash = sha256(String(token || ''));
  const credential = await database.customerLicenseCredential.findUnique({
    where: { setupTokenHash },
    include: { order: true }
  });
  if (!credential || credential.setupUsedAt || !credential.setupExpiresAt ||
      credential.setupExpiresAt.getTime() < now.getTime() ||
      !['paid', 'delivered'].includes(credential.order.status)) {
    return { ok: false, reason: 'gecersiz-veya-suresi-dolmus-baglanti' };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const changed = await database.customerLicenseCredential.updateMany({
    where: {
      id: credential.id,
      setupTokenHash,
      setupUsedAt: null,
      setupExpiresAt: { gte: now }
    },
    data: {
      passwordHash,
      passwordTemporary: false,
      temporaryPasswordExpiresAt: null,
      setupTokenHash: null,
      setupExpiresAt: null,
      setupUsedAt: now,
      failedAttempts: 0,
      lockedUntil: null,
      authVersion: { increment: 1 }
    }
  });
  return changed.count === 1
    ? { ok: true, licenseNo: credential.licenseNo }
    : { ok: false, reason: 'gecersiz-veya-suresi-dolmus-baglanti' };
}

export async function verifyCustomerPassword({ database, licenseNo, password, now = new Date() }) {
  const normalized = normalizeLicenseNo(licenseNo);
  const credential = await database.customerLicenseCredential.findUnique({
    where: { licenseNo: normalized },
    include: { order: true }
  });
  if (!credential || !credential.passwordHash || !['paid', 'delivered'].includes(credential.order.status)) {
    await bcrypt.compare(String(password || ''), DUMMY_PASSWORD_HASH);
    return { ok: false, status: 401, reason: 'giris-dogrulanamadi' };
  }
  if (credential.lockedUntil && credential.lockedUntil.getTime() > now.getTime()) {
    return { ok: false, status: 429, reason: 'cok-fazla-deneme', retryAt: credential.lockedUntil };
  }

  const matches = await bcrypt.compare(String(password || ''), credential.passwordHash);
  if (!matches) {
    const previous = credential.lockedUntil && credential.lockedUntil.getTime() <= now.getTime()
      ? 0
      : credential.failedAttempts;
    const failedAttempts = previous + 1;
    const lockedUntil = failedAttempts >= CUSTOMER_MAX_FAILURES
      ? new Date(now.getTime() + CUSTOMER_LOCK_MS)
      : null;
    await database.customerLicenseCredential.update({
      where: { id: credential.id },
      data: { failedAttempts, lockedUntil }
    });
    return {
      ok: false,
      status: lockedUntil ? 429 : 401,
      reason: lockedUntil ? 'cok-fazla-deneme' : 'giris-dogrulanamadi',
      retryAt: lockedUntil
    };
  }

  if (credential.passwordTemporary && (!credential.temporaryPasswordExpiresAt ||
      credential.temporaryPasswordExpiresAt.getTime() < now.getTime())) {
    return { ok: false, status: 410, reason: 'gecici-parola-suresi-doldu' };
  }

  await database.customerLicenseCredential.update({
    where: { id: credential.id },
    data: { failedAttempts: 0, lockedUntil: null }
  });
  return { ok: true, credential };
}

export async function replaceTemporaryPassword({ database, sessionToken, password, now = new Date() }) {
  const session = await findCustomerSession({ database, token: sessionToken, now });
  if (!session || !session.credential.passwordTemporary) {
    return { ok: false, status: 401, reason: 'oturum-gecersiz' };
  }
  const expiresAt = session.credential.temporaryPasswordExpiresAt;
  if (!expiresAt || expiresAt.getTime() < now.getTime()) {
    return { ok: false, status: 410, reason: 'gecici-parola-suresi-doldu' };
  }
  if (await bcrypt.compare(String(password || ''), session.credential.passwordHash)) {
    return { ok: false, status: 400, reason: 'yeni-parola-farkli-olmali' };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const token = createSecretToken();
  const sessionExpiresAt = new Date(now.getTime() + CUSTOMER_SESSION_MS);
  const result = await database.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`customer-credential:${session.credential.id}`}))`;
    const changed = await tx.customerLicenseCredential.updateMany({
      where: {
        id: session.credential.id,
        passwordTemporary: true,
        temporaryPasswordExpiresAt: { gte: now }
      },
      data: {
        passwordHash,
        passwordTemporary: false,
        temporaryPasswordExpiresAt: null,
        failedAttempts: 0,
        lockedUntil: null,
        authVersion: { increment: 1 }
      }
    });
    if (changed.count !== 1) return null;
    await tx.customerLicenseSession.updateMany({
      where: { credentialId: session.credential.id, revokedAt: null },
      data: { revokedAt: now }
    });
    await tx.customerLicenseSession.create({
      data: {
        credentialId: session.credential.id,
        tokenHash: sha256(token),
        expiresAt: sessionExpiresAt
      }
    });
    return { licenseNo: session.credential.licenseNo };
  }, { timeout: 15000 });

  return result
    ? { ok: true, token, expiresAt: sessionExpiresAt, licenseNo: result.licenseNo }
    : { ok: false, status: 409, reason: 'parola-zaten-degistirildi' };
}

export async function createCustomerSession({ database, credentialId, now = new Date() }) {
  const token = createSecretToken();
  const expiresAt = new Date(now.getTime() + CUSTOMER_SESSION_MS);
  await database.customerLicenseSession.create({
    data: { credentialId, tokenHash: sha256(token), expiresAt }
  });
  return { token, expiresAt };
}

export async function findCustomerSession({ database, token, now = new Date() }) {
  if (!token) return null;
  const session = await database.customerLicenseSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { credential: { include: { order: true } } }
  });
  if (!session || session.revokedAt || session.expiresAt.getTime() < now.getTime()) return null;
  if (!['paid', 'delivered'].includes(session.credential.order.status)) return null;
  return session;
}
