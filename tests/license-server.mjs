import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LICENSE_ACTIONS,
  LICENSE_ROLE_ACTIONS,
  LICENSE_ROLES,
  licenseAuthorizationDecision
} from '../src/lib/license/policy.mjs';
import { LICENSE_LEVELS, LICENSE_PROTOCOL, effectiveLicenseRights } from '../src/lib/license/contract.mjs';
import { verifyLicenseResponse } from '../src/lib/license/protocol.mjs';
import { desktopCompatibleRights, verifyLicenseRequest } from '../src/lib/license/service.mjs';
import { authorizeLicenseRequest, licenseSessionTokenHash } from '../src/lib/license/access.mjs';
import { canonicalJson, canonicalLicenseEvent, createLicenseEvent } from '../src/lib/license/events.mjs';
import {
  base32Decode,
  consumeRecoveryCode,
  decodeMfaEncryptionKey,
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  recoveryCodeHash,
  totpCode,
  verifyTotp
} from '../src/lib/license/mfa.mjs';
import { LICENSE_AUTH_MAX_FAILURES, LICENSE_SESSION_MS } from '../src/lib/license/admin-auth.mjs';
import { parseGithubLatestYaml } from '../src/lib/github-release.mjs';
import { resolvePreviousLicense } from '../src/lib/license/sync-previous.mjs';
import {
  LICENSE_GOOGLE_CHALLENGE_MS,
  createLicenseGoogleChallenge,
  licenseGoogleClientId,
  licenseGoogleOwnerEmail,
  verifyLicenseGoogleChallenge,
  verifyLicenseGoogleCredential
} from '../src/lib/license/google-auth.mjs';
import jwt from 'jsonwebtoken';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const passed = [];
async function test(name, fn) {
  await fn();
  passed.push(name);
  console.log('✓ ' + name);
}

function baseRequest(now, suffix = 'a') {
  return {
    protokol: LICENSE_PROTOCOL,
    lisansParmakIzi: 'a'.repeat(64),
    uygulama: 'hermes',
    cihazKimligi: suffix.repeat(64).slice(0, 64),
    uygulamaSurumu: '1.6.12',
    istekZamani: now.toISOString(),
    nonce: 'nonce_0123456789_' + suffix
  };
}

function baseLicense(overrides = {}) {
  return {
    id: 'license-1',
    status: 'aktif',
    signedLevel: 'tam',
    signedFeatures: ['dereceler', 'ai', 'analizler'],
    remoteLevel: 'tam',
    remoteFeatures: ['dereceler', 'ai', 'analizler'],
    authorizationVersion: 3,
    deviceLimit: 1,
    monitoringOnly: true,
    expiresAt: null,
    ...overrides
  };
}

class FakeRepository {
  constructor(license) {
    this.license = license;
    this.nonces = new Set();
    this.devices = new Map();
    this.leases = [];
    this.securityEvents = [];
  }
  async findLicense(fingerprint, application) {
    return fingerprint === 'a'.repeat(64) && application === 'hermes' ? this.license : null;
  }
  async consumeNonce({ nonceHash }) {
    if (this.nonces.has(nonceHash)) return false;
    this.nonces.add(nonceHash);
    return true;
  }
  async bindDevice({ license, deviceHash }) {
    if (this.devices.has(deviceHash)) return { allowed: true, deviceId: this.devices.get(deviceHash) };
    if (this.devices.size >= license.deviceLimit) return { allowed: false, deviceId: null };
    const id = 'device-' + (this.devices.size + 1);
    this.devices.set(deviceHash, id);
    return { allowed: true, deviceId: id };
  }
  async saveLease(data) { this.leases.push(data); }
  async recordSecurityEvent(data) { this.securityEvents.push(data); }
}

const keys = crypto.generateKeyPairSync('ed25519');
const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' });

await test('Çevrimiçi yetki yalnız çevrimdışı imzalı tavanın alt kümesi olabiliyor', () => {
  assert.deepEqual(LICENSE_LEVELS, ['temel', 'tam', 'pro', 'yonetici']);
  assert.deepEqual(effectiveLicenseRights({
    signedLevel: 'pro', signedFeatures: ['dereceler', 'analizler'],
    remoteLevel: 'pro', remoteFeatures: ['dereceler', 'analizler']
  }), { ok: true, rights: { seviye: 'pro', ozellikler: ['dereceler', 'analizler'] } });
  assert.equal(effectiveLicenseRights({
    signedLevel: 'tam', signedFeatures: ['dereceler', 'analizler'],
    remoteLevel: 'pro', remoteFeatures: ['dereceler', 'analizler']
  }).reason, 'uzak-seviye-tavan-ustu');
  assert.deepEqual(effectiveLicenseRights({
    signedLevel: 'tam', signedFeatures: ['dereceler', 'ai'],
    remoteLevel: 'temel', remoteFeatures: ['dereceler', 'ai']
  }), { ok: true, rights: { seviye: 'temel', ozellikler: ['dereceler'] } });
  assert.equal(effectiveLicenseRights({
    signedLevel: 'temel', signedFeatures: ['dereceler'],
    remoteLevel: 'tam', remoteFeatures: ['dereceler']
  }).reason, 'uzak-seviye-tavan-ustu');
  assert.equal(effectiveLicenseRights({
    signedLevel: 'tam', signedFeatures: ['dereceler'],
    remoteLevel: 'tam', remoteFeatures: ['egitim']
  }).reason, 'uzak-ozellik-tavan-ustu');
  assert.equal(effectiveLicenseRights({
    signedLevel: 'tam', signedFeatures: ['dereceler', 'gelecek'],
    remoteLevel: 'tam', remoteFeatures: ['dereceler']
  }).reason, 'imzali-tavanda-bilinmeyen-ozellik');
});

await test('Hermes 1.7.7–1.7.9 güncelleme kurtarması Analizlerim hakkını seviyede koruyor', () => {
  const rights = { seviye: 'yonetici', ozellikler: ['dereceler', 'analizler', 'egitim'] };
  for (const applicationVersion of ['1.7.7', '1.7.8', '1.7.9']) {
    assert.deepEqual(desktopCompatibleRights({ application: 'hermes', applicationVersion, rights }), {
      seviye: 'yonetici', ozellikler: ['dereceler', 'egitim']
    });
  }
  assert.strictEqual(desktopCompatibleRights({ application: 'hermes', applicationVersion: '1.7.6', rights }), rights);
  assert.strictEqual(desktopCompatibleRights({ application: 'hermes', applicationVersion: '1.7.10', rights }), rights);
  assert.strictEqual(desktopCompatibleRights({ application: 'astropen', applicationVersion: '1.7.7', rights }), rights);
});

await test('Hermes 1.7.7 sunucu cevabı İdari seviyeyi koruyup eski istemcide doğrulanabilir kalıyor', async () => {
  const now = new Date('2026-08-12T15:00:00.000Z');
  const repo = new FakeRepository(baseLicense({
    signedLevel: 'yonetici',
    signedFeatures: ['dereceler', 'analizler', 'egitim'],
    remoteLevel: 'yonetici',
    remoteFeatures: ['dereceler', 'analizler', 'egitim']
  }));
  const result = await verifyLicenseRequest({
    raw: { ...baseRequest(now), uygulamaSurumu: '1.7.7' }, repository: repo, now, privateKey
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.yetki, {
    seviye: 'yonetici', ozellikler: ['dereceler', 'egitim'], yetkiSurumu: 3
  });
  assert.equal(verifyLicenseResponse(result.body, publicKey), true);
});

await test('Pro seviyesi masaüstü eşitleme ve web yönetiminde ortak sözleşmeden açılıyor', () => {
  const syncRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/esitle/route.js'), 'utf8');
  const client = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/lisans/LisansClient.jsx'), 'utf8');
  assert.ok(syncRoute.includes("import { LICENSE_FEATURES, LICENSE_LEVELS } from '@/lib/license/contract.mjs'"));
  assert.ok(syncRoute.includes('seviye: z.enum(LICENSE_LEVELS)'));
  assert.ok(syncRoute.includes('ozellikler: z.array(z.enum(LICENSE_FEATURES))'));
  assert.ok(client.includes("const LEVELS = ['temel', 'tam', 'pro', 'yonetici']"));
});

await test('Masaüstü yenileme önceki lisansı öncelikle lisans numarasıyla çözüyor', async () => {
  const exact = { id: 'old-1', licenseNo: 'ZERKAR0808261812', application: 'hermes', devices: [] };
  let deviceLookup = false;
  const database = {
    license: { findUnique: async ({ where }) => where.licenseNo ? exact : null },
    licenseDevice: { findMany: async () => { deviceLookup = true; return []; } }
  };
  const result = await resolvePreviousLicense(database, {
    requestedLicenseNo: exact.licenseNo,
    deviceHash: 'd'.repeat(64),
    application: 'hermes'
  });
  assert.equal(result.license, exact);
  assert.equal(result.matchedBy, 'license-no');
  assert.equal(deviceLookup, false);
});

await test('Yerelde kalmış başarısız lisans numarası aynı aktif cihazdaki canlı lisansa güvenle bağlanıyor', async () => {
  const previous = { id: 'old-1', licenseNo: 'ZERKAR0808261812', application: 'hermes', devices: [{ active: true }] };
  const database = {
    license: {
      findUnique: async ({ where }) => where.licenseNo ? null : (where.id === previous.id ? previous : null)
    },
    licenseDevice: { findMany: async () => [{ licenseId: previous.id }] }
  };
  const result = await resolvePreviousLicense(database, {
    requestedLicenseNo: 'ZERKAR1108262219',
    deviceHash: 'd'.repeat(64),
    application: 'hermes'
  });
  assert.equal(result.license, previous);
  assert.equal(result.matchedBy, 'device');
  assert.equal(result.requestedLicenseNo, 'ZERKAR1108262219');
});

await test('Birden fazla aktif cihaz adayı varsa önceki lisans tahmin edilmiyor', async () => {
  const database = {
    license: { findUnique: async () => null },
    licenseDevice: { findMany: async () => [{ licenseId: 'old-1' }, { licenseId: 'old-2' }] }
  };
  const result = await resolvePreviousLicense(database, {
    requestedLicenseNo: 'ZERKAR1108262219',
    deviceHash: 'd'.repeat(64),
    application: 'hermes'
  });
  assert.equal(result.license, null);
  assert.equal(result.matchedBy, 'ambiguous-device');
});

await test('Aktif lisans 24 saat kontrol ve 7 gün tolerans taşıyan doğrulanabilir Ed25519 cevap alıyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const repo = new FakeRepository(baseLicense());
  const result = await verifyLicenseRequest({ raw: baseRequest(now), repository: repo, now, privateKey, keyVersion: 4 });
  assert.equal(result.status, 200);
  assert.equal(result.body.durum, 'aktif');
  assert.equal(result.body.izlemeModu, true);
  assert.deepEqual(result.body.yetki, { seviye: 'tam', ozellikler: ['dereceler', 'analizler'], yetkiSurumu: 3 });
  assert.equal(new Date(result.body.sonrakiKontrol) - now, 24 * 60 * 60 * 1000);
  assert.equal(new Date(result.body.toleransBitisi) - now, 7 * 24 * 60 * 60 * 1000);
  assert.equal(result.body.anahtarSurumu, 4);
  assert.equal(verifyLicenseResponse(result.body, publicKey), true);
  assert.equal(repo.leases.length, 1);
  const tampered = structuredClone(result.body);
  tampered.yetki.ozellikler.push('egitim');
  assert.equal(verifyLicenseResponse(tampered, publicKey), false);
});

await test('Nonce yeniden oynatması ve eski saatli istek genel hata ile reddediliyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const repo = new FakeRepository(baseLicense());
  const request = baseRequest(now);
  assert.equal((await verifyLicenseRequest({ raw: request, repository: repo, now, privateKey })).status, 200);
  const replay = await verifyLicenseRequest({ raw: request, repository: repo, now, privateKey });
  assert.deepEqual(replay, { status: 409, body: { tamam: false, error: 'istek-tekrarlandi' } });
  const stale = baseRequest(new Date(now.getTime() - 11 * 60 * 1000), 'b');
  assert.deepEqual(await verifyLicenseRequest({ raw: stale, repository: repo, now, privateKey }), {
    status: 400, body: { tamam: false, error: 'gecersiz-istek' }
  });
});

await test('İzleme modu askı durumunu gözlüyor ama erişimi kapatmıyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const result = await verifyLicenseRequest({
    raw: baseRequest(now), repository: new FakeRepository(baseLicense({ status: 'askida', monitoringOnly: true })),
    now, privateKey
  });
  assert.equal(result.body.gozlenenDurum, 'askida');
  assert.equal(result.body.durum, 'aktif');
  assert.equal(result.body.izlemeModu, true);
});

await test('Lisans kaydı yaptırıma hazır olsa bile global ortam kapısı kapalıyken izleme sürüyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const result = await verifyLicenseRequest({
    raw: baseRequest(now),
    repository: new FakeRepository(baseLicense({ status: 'askida', monitoringOnly: false })),
    now,
    privateKey,
    enforcementEnabled: false
  });
  assert.equal(result.body.gozlenenDurum, 'askida');
  assert.equal(result.body.durum, 'aktif');
  assert.equal(result.body.izlemeModu, true);
});

await test('Yaptırım kaydı açıkken askı tolerans vermeden imzalı kapanıyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const result = await verifyLicenseRequest({
    raw: baseRequest(now), repository: new FakeRepository(baseLicense({ status: 'askida', monitoringOnly: false })),
    now, privateKey, enforcementEnabled: true
  });
  assert.equal(result.body.durum, 'askida');
  assert.equal(result.body.sonrakiKontrol, now.toISOString());
  assert.equal(result.body.toleransBitisi, now.toISOString());
  assert.equal(verifyLicenseResponse(result.body, publicKey), true);
});

await test('Tek cihaz limiti ikinci cihazı bilgi sızdırmadan cihaz transferine alıyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const repo = new FakeRepository(baseLicense({ monitoringOnly: false }));
  assert.equal((await verifyLicenseRequest({ raw: baseRequest(now, 'b'), repository: repo, now, privateKey, enforcementEnabled: true })).body.durum, 'aktif');
  const second = await verifyLicenseRequest({ raw: baseRequest(new Date(now.getTime() + 1000), 'c'), repository: repo, now: new Date(now.getTime() + 1000), privateKey, enforcementEnabled: true });
  assert.equal(second.body.durum, 'cihaz_transferi');
  assert.equal(second.body.toleransBitisi, new Date(now.getTime() + 1000).toISOString());
});

await test('Onaylanan cihaz transferi veya süreli askı bitimi sonraki imzalı kontrolde lisansı aktifleştiriyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  for (const completion of ['transferCompleted', 'suspensionCompleted']) {
    const repo = new FakeRepository(baseLicense({
      status: completion === 'transferCompleted' ? 'cihaz_transferi' : 'askida',
      monitoringOnly: false
    }));
    repo.bindDevice = async () => ({ allowed: true, deviceId: 'device-1', [completion]: true });
    const result = await verifyLicenseRequest({
      raw: baseRequest(now, completion === 'transferCompleted' ? 'd' : 'e'),
      repository: repo,
      now,
      privateKey,
      enforcementEnabled: true
    });
    assert.equal(result.body.durum, 'aktif');
    assert.equal(result.body.gozlenenDurum, 'aktif');
    assert.equal(new Date(result.body.toleransBitisi) - now, 7 * 24 * 60 * 60 * 1000);
  }
});

await test('Dört yönetici rolünün işlem matrisi varsayılan-ret çalışıyor', () => {
  const base = (role, action) => ({
    role, action, sessionValid: true, mfaVerified: true, reauthenticated: true,
    reason: 'test', suspensionDays: 7, licenseNo: 'ZERKAR0208260935',
    licenseNoConfirmation: 'ZERKAR0208260935'
  });
  for (const role of LICENSE_ROLES) {
    for (const action of LICENSE_ACTIONS) {
      assert.equal(
        licenseAuthorizationDecision(base(role, action)).allowed,
        LICENSE_ROLE_ACTIONS[role].has(action),
        `${role}/${action}`
      );
    }
  }
  assert.equal(licenseAuthorizationDecision({ ...base('sahip', 'lisans.listele'), mfaVerified: false }).reason, 'mfa-gerekli');
  assert.equal(licenseAuthorizationDecision({ ...base('destek', 'lisans.askiya_al'), suspensionDays: 8 }).reason, 'destek-en-fazla-7-gun');
  assert.equal(licenseAuthorizationDecision({ ...base('sahip', 'lisans.kalici_iptal'), licenseNoConfirmation: 'YANLIS' }).reason, 'lisans-no-onayi-gerekli');
});

await test('Lisans yönetim kapısı rolü her istekte veritabanından ve iptal edilebilir MFA oturumundan doğruluyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const secret = 'test-secret-at-least-32-characters-long';
  const sessionId = 'session-1';
  const token = jwt.sign({ sub: 'owner@example.invalid', role: 'admin' }, secret, {
    expiresIn: '1h', jwtid: sessionId
  });
  const user = {
    id: 'admin-1', email: 'owner@example.invalid', licenseRole: 'sahip', licenseActive: true,
    licenseMfaEnabled: true, licenseAuthVersion: 3
  };
  const session = {
    id: sessionId, adminId: user.id, tokenHash: licenseSessionTokenHash(token), authVersion: 3,
    mfaVerifiedAt: now, reauthenticatedAt: now,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000), revokedAt: null
  };
  let lastSeenAt = null;
  const database = {
    adminUser: { findUnique: async () => ({ ...user }) },
    adminSession: {
      findUnique: async () => ({ ...session }),
      update: async ({ data }) => { lastSeenAt = data.lastSeenAt; }
    }
  };
  const request = { headers: new Headers({ authorization: 'Bearer ' + token }) };
  const allowed = await authorizeLicenseRequest({
    request, action: 'lisans.listele', database, now, jwtSecret: secret
  });
  assert.equal(allowed.ok, true);
  assert.deepEqual(allowed.actor, { id: user.id, email: user.email, role: 'sahip' });
  assert.equal(lastSeenAt, now);

  const revoked = await authorizeLicenseRequest({
    request,
    action: 'lisans.kalici_iptal',
    database,
    now,
    jwtSecret: secret,
    reason: 'kalici iptal testi',
    licenseNo: 'ZERKAR0208260935',
    licenseNoConfirmation: 'ZERKAR0208260935'
  });
  assert.equal(revoked.ok, true);

  database.adminSession.findUnique = async () => ({
    ...session,
    reauthenticatedAt: new Date(now.getTime() - 11 * 60 * 1000)
  });
  assert.deepEqual(await authorizeLicenseRequest({
    request,
    action: 'lisans.kalici_iptal',
    database,
    now,
    jwtSecret: secret,
    reason: 'kalici iptal testi',
    licenseNo: 'ZERKAR0208260935',
    licenseNoConfirmation: 'ZERKAR0208260935'
  }), { ok: false, status: 403, error: 'forbidden' });

  database.adminSession.findUnique = async () => ({ ...session, revokedAt: now });
  assert.deepEqual(await authorizeLicenseRequest({
    request, action: 'lisans.listele', database, now, jwtSecret: secret
  }), { ok: false, status: 403, error: 'forbidden' });

  const legacyToken = jwt.sign({ sub: user.email, role: 'admin' }, secret, { expiresIn: '1h' });
  assert.deepEqual(await authorizeLicenseRequest({
    request: { headers: new Headers({ authorization: 'Bearer ' + legacyToken }) },
    action: 'lisans.listele', database, now, jwtSecret: secret
  }), { ok: false, status: 401, error: 'unauthorized' });
});

await test('Denetim olayı kanonik hash zinciri taşıyor ve içerik değişince hash bozuluyor', () => {
  const base = {
    licenseId: 'license-1', actorId: 'admin-1', actorRole: 'sahip',
    action: 'lisans.askiya_al', outcome: 'basarili', reason: 'test',
    beforeState: { durum: 'aktif' }, afterState: { durum: 'askida' },
    requestId: '123e4567-e89b-12d3-a456-426614174000', previousHash: 'b'.repeat(64),
    createdAt: new Date('2026-08-02T09:00:00.000Z')
  };
  const event = createLicenseEvent(base);
  assert.match(event.eventHash, /^[0-9a-f]{64}$/);
  assert.equal(createLicenseEvent({ ...base }).eventHash, event.eventHash);
  assert.notEqual(createLicenseEvent({ ...base, reason: 'degisti' }).eventHash, event.eventHash);
  assert.ok(canonicalLicenseEvent(event).includes('lisans.askiya_al'));
  assert.deepEqual(canonicalJson({ z: 1, a: { y: 2, b: 3 } }), { a: { b: 3, y: 2 }, z: 1 });
  assert.equal(
    createLicenseEvent({ ...base, afterState: { z: 1, a: 2 } }).eventHash,
    createLicenseEvent({ ...base, afterState: { a: 2, z: 1 } }).eventHash
  );
});

await test('TOTP RFC vektörünü doğruluyor ve aynı zaman sayacı ikinci kez kullanılamıyor', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(base32Decode(secret).toString('ascii'), '12345678901234567890');
  assert.equal(totpCode({ secret, counter: 1n }), '287082');
  const at59Seconds = new Date(59000);
  assert.equal(verifyTotp({ secret, token: '287082', now: at59Seconds }), 1n);
  assert.equal(verifyTotp({ secret, token: '287082', now: at59Seconds, lastCounter: 1n }), null);
});

await test('MFA sırrı ayrı 32 baytlık anahtarla AES-GCM şifreleniyor ve kurcalama reddediliyor', () => {
  const key = decodeMfaEncryptionKey(crypto.randomBytes(32).toString('base64'));
  const encrypted = encryptMfaSecret('JBSWY3DPEHPK3PXP', key);
  assert.equal(decryptMfaSecret(encrypted, key), 'JBSWY3DPEHPK3PXP');
  const parts = encrypted.split('.');
  parts[3] = (parts[3].startsWith('A') ? 'B' : 'A') + parts[3].slice(1);
  assert.throws(() => decryptMfaSecret(parts.join('.'), key));
});

await test('Sekiz yüksek entropili kurtarma kodu yalnız bir kez tüketilebiliyor', () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, 8);
  assert.equal(new Set(codes).size, 8);
  const hashes = codes.map(recoveryCodeHash);
  const first = consumeRecoveryCode(codes[0], hashes);
  assert.equal(first.ok, true); assert.equal(first.remaining.length, 7);
  assert.equal(consumeRecoveryCode(codes[0], first.remaining).ok, false);
});

await test('Lisans yönetim oturumu kısa ömür ve başarısız deneme kilidi sözleşmesini taşıyor', () => {
  assert.equal(LICENSE_SESSION_MS, 30 * 60 * 1000);
  assert.equal(LICENSE_AUTH_MAX_FAILURES, 5);
  const source = fs.readFileSync(path.join(ROOT, 'src/lib/license/admin-auth.mjs'), 'utf8');
  assert.ok(source.includes('licenseLockedUntil'));
  assert.ok(source.includes('reauthenticatedAt: now'));
  assert.ok(source.includes("role: 'license_admin'"));
});

await test('Google sahip kimliği yalnız doğrulanmış Gmail, doğru audience ve değişmez subject kabul ediyor', async () => {
  const clientId = licenseGoogleClientId('test-client.apps.googleusercontent.com');
  assert.equal(licenseGoogleOwnerEmail('  OWNER@GMAIL.COM '), 'owner@gmail.com');
  const verifier = {
    async verifyIdToken(options) {
      assert.deepEqual(options, { idToken: 'signed-google-id-token', audience: clientId });
      return { getPayload: () => ({ sub: 'google-sub-1', email: 'OWNER@gmail.com', email_verified: true }) };
    }
  };
  assert.deepEqual(await verifyLicenseGoogleCredential({
    credential: 'signed-google-id-token', clientId, verifier
  }), { email: 'owner@gmail.com', googleSub: 'google-sub-1' });
  await assert.rejects(() => verifyLicenseGoogleCredential({
    credential: 'bad', clientId, verifier: { verifyIdToken: async () => ({ getPayload: () => ({ email_verified: true }) }) }
  }));
  assert.throws(() => licenseGoogleOwnerEmail('owner@example.com'));
});

await test('Google sonrası MFA meydan okuması beş dakikalık ve tarayıcı bağlamına bağlı', () => {
  const now = new Date('2026-08-02T12:00:00.000Z');
  const secret = 'google-challenge-secret-that-is-long-enough';
  const request = new Request('https://example.test', { headers: { 'user-agent': 'Hermes-Test/1' } });
  const created = createLicenseGoogleChallenge({
    user: { email: 'owner@gmail.com', licenseAuthVersion: 7 },
    googleSub: 'google-sub-1', request, now, jwtSecret: secret
  });
  assert.equal(new Date(created.expiresAt) - now, LICENSE_GOOGLE_CHALLENGE_MS);
  const claims = verifyLicenseGoogleChallenge({ challenge: created.challenge, request, now, jwtSecret: secret });
  assert.equal(claims.scope, 'license_google_mfa');
  assert.equal(claims.sub, 'owner@gmail.com');
  assert.equal(claims.googleSub, 'google-sub-1');
  assert.equal(claims.authVersion, 7);
  assert.throws(() => verifyLicenseGoogleChallenge({
    challenge: created.challenge,
    request: new Request('https://example.test', { headers: { 'user-agent': 'Baska-Tarayici/1' } }),
    now,
    jwtSecret: secret
  }));
  assert.throws(() => verifyLicenseGoogleChallenge({
    challenge: created.challenge,
    request,
    now: new Date(now.getTime() + LICENSE_GOOGLE_CHALLENGE_MS + 1000),
    jwtSecret: secret
  }));
});

await test('Migration bütün tabloları, append-only olayı ve ters rollback sırasını taşıyor', () => {
  const migration = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260802114500_license_server_foundation/migration.sql'), 'utf8');
  const rollback = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260802114500_license_server_foundation/rollback.sql'), 'utf8');
  for (const table of ['License', 'LicenseAlias', 'LicenseDevice', 'LicenseLease', 'LicenseNonce', 'LicenseEvent', 'LicenseImport', 'AdminSession']) {
    assert.ok(migration.includes(`CREATE TABLE "${table}"`), table);
    assert.ok(rollback.includes(`DROP TABLE IF EXISTS "${table}"`), table);
  }
  assert.ok(migration.includes('LicenseEvent_append_only_update'));
  assert.ok(migration.includes('LicenseEvent_append_only_delete'));
  assert.ok(migration.includes('License_permanent_revoke_check'));
  assert.ok(migration.includes('"suspendedUntil" TIMESTAMP(3)'));
  assert.ok(migration.includes('"reauthenticatedAt" TIMESTAMP(3)'));
  assert.ok(migration.includes('"licenseMfaSecretCipher" TEXT'));
  assert.ok(migration.includes('"licenseMfaLastCounter" BIGINT'));
  assert.ok(migration.includes('"licenseMfaRecoveryHashes" JSONB'));
  assert.ok(migration.includes('AdminUser_licenseFailedAttempts_check'));
});

await test('Google sahip bağı migrationı değişmez subject alanını tekil ve geri alınabilir ekliyor', () => {
  const migration = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260802153000_license_google_owner_auth/migration.sql'), 'utf8');
  const rollback = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260802153000_license_google_owner_auth/rollback.sql'), 'utf8');
  assert.ok(migration.includes('"licenseGoogleSub" TEXT'));
  assert.ok(migration.includes('UNIQUE INDEX'));
  assert.ok(rollback.includes('DROP COLUMN IF EXISTS "licenseGoogleSub"'));
});

await test('EFT geçici parola migrationı yalnız durum ve süre alanlarını geri alınabilir ekliyor', () => {
  const migration = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260802230000_eft_temporary_password/migration.sql'), 'utf8');
  const rollback = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260802230000_eft_temporary_password/rollback.sql'), 'utf8');
  assert.ok(migration.includes('"passwordTemporary" BOOLEAN NOT NULL DEFAULT false'));
  assert.ok(migration.includes('"temporaryPasswordExpiresAt" TIMESTAMP(3)'));
  assert.ok(!migration.includes('temporaryPassword" TEXT'));
  assert.ok(rollback.includes('DROP COLUMN IF EXISTS "passwordTemporary"'));
});

await test('İndirme daveti migrationı yalnız özetli sırlar, süreler ve geri alınabilir tablolar taşıyor', () => {
  const migration = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260802234500_download_invites/migration.sql'), 'utf8');
  const rollback = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260802234500_download_invites/rollback.sql'), 'utf8');
  assert.ok(migration.includes('CREATE TABLE "DownloadInvite"'));
  assert.ok(migration.includes('CREATE TABLE "DownloadSession"'));
  assert.ok(migration.includes('"linkTokenHash" CHAR(64) NOT NULL'));
  assert.ok(migration.includes('"passwordHash" TEXT NOT NULL'));
  assert.ok(!migration.includes('temporaryPassword'));
  assert.ok(rollback.indexOf('"DownloadSession"') < rollback.indexOf('"DownloadInvite"'));
});

await test('Masaüstü eşleştirmesi ve özel yayın migrationı geri alınabilir, sırları yalnız özetli tutuyor', () => {
  const migration = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260803003000_desktop_pairing_private_release/migration.sql'), 'utf8');
  const rollback = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260803003000_desktop_pairing_private_release/rollback.sql'), 'utf8');
  assert.ok(migration.includes('CREATE TABLE "DesktopPairing"'));
  assert.ok(migration.includes('"secretHash" CHAR(64) NOT NULL'));
  assert.ok(!migration.includes('"secret" TEXT'));
  assert.ok(migration.includes('CREATE TABLE "ReleaseArtifact"'));
  assert.ok(rollback.indexOf('DROP TABLE IF EXISTS "ReleaseArtifact"') < rollback.indexOf('DROP TABLE IF EXISTS "DesktopPairing"'));
});

await test('Lisans müşteri e-postası ayrı ve geri alınabilir bir migration ile tutuluyor', () => {
  const migration = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260803020000_license_customer_email/migration.sql'), 'utf8');
  const rollback = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260803020000_license_customer_email/rollback.sql'), 'utf8');
  const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf8');
  assert.ok(migration.includes('ADD COLUMN "customerEmail" TEXT'));
  assert.ok(migration.includes('CREATE INDEX "License_customerEmail_idx"'));
  assert.ok(rollback.includes('DROP COLUMN IF EXISTS "customerEmail"'));
  assert.ok(schema.includes('customerEmail        String?'));
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(packageJson.scripts['license:backfill-emails'], 'node --env-file-if-exists=.env prisma/license-customer-email-backfill.mjs');
});

await test('Doğrulama API’si özellik bayrağı kapalı ve özel anahtar yokken fail-closed kalıyor', () => {
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/dogrula/route.js'), 'utf8');
  assert.ok(route.includes("process.env.LICENSE_V1_ENABLED !== '1'"));
  assert.ok(route.indexOf("LICENSE_V1_ENABLED !== '1'") < route.indexOf('request.json()'));
  assert.ok(route.includes('LICENSE_STATUS_PRIVATE_KEY_B64'));
  assert.ok(route.includes('pg_advisory_xact_lock'));
  assert.ok(route.includes('appendLicenseEvent'));
  assert.ok(!route.includes('gizli-anahtar.pem'));
});

await test('Bütün yönetim API’leri özellik bayrağı kapalıyken gövde veya veritabanı okumadan kapanıyor', () => {
  const routes = [
    ['durum', 'request.json()'],
    ['liste', 'authorizeLicenseRequest'],
    ['gecmis', 'authorizeLicenseRequest'],
    ['yetki', 'request.json()'],
    ['cihaz-transferi', 'request.json()'],
    ['kullanicilar', 'request.json()'],
    ['siparisler', 'authorizeLicenseRequest'],
    ['siparisler/[id]', 'request.json()'],
    ['siparisler/[id]/eft-onay', 'request.json()'],
    ['indirme-daveti', 'request.json()'],
    ['yaptirim', 'request.json()'],
    ['esitle', 'request.json()'],
    ['masaustu/baslat', "request.headers.get('x-hermes-desktop-client')"],
    ['masaustu/durum', 'request.json()'],
    ['masaustu/onayla', 'request.json()'],
    ['oturum/giris', 'request.json()'],
    ['oturum/mfa-baslat', 'request.json()'],
    ['oturum/mfa-dogrula', 'request.json()'],
    ['oturum/google-yapilandirma', 'licenseGoogleClientId'],
    ['oturum/google-baslat', 'request.json()'],
    ['oturum/google-dogrula', 'request.json()'],
    ['oturum/yeniden-dogrula', 'request.json()'],
    ['oturum/cikis', 'authorizeLicenseRequest']
  ];
  for (const [name, firstSensitiveOperation] of routes) {
    const route = fs.readFileSync(path.join(ROOT, `src/app/api/lisans/v1/yonetim/${name}/route.js`), 'utf8');
    const gate = route.indexOf("process.env.LICENSE_V1_ENABLED !== '1'");
    assert.ok(gate >= 0, name);
    assert.ok(gate < route.indexOf(firstSensitiveOperation, gate), name);
  }
});

await test('Yönetim durum API’si kalıcı iptali terminal tutuyor ve yeniden doğrulamayı gövdeden almıyor', () => {
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/durum/route.js'), 'utf8');
  assert.ok(route.includes("if (from === 'iptal') return false"));
  assert.ok(route.includes("action: ACTION[q.durum]"));
  assert.ok(route.includes('appendLicenseEvent'));
  assert.ok(route.includes('pg_advisory_xact_lock'));
  assert.ok(!route.includes('reauthenticated:'));
  assert.ok(route.includes('licenseNoConfirmation: q.lisansNoOnayi'));
});

await test('Cihaz transferi ve yetki API’leri ortak lisans kilidi, rol kapısı ve olay zinciri kullanıyor', () => {
  const transfer = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/cihaz-transferi/route.js'), 'utf8');
  const rights = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/yetki/route.js'), 'utf8');
  assert.ok(transfer.includes("action: 'lisans.cihaz_transferi'"));
  assert.ok(transfer.includes('license:${found.id}'));
  assert.ok(transfer.includes('appendLicenseEvent'));
  assert.ok(rights.includes("action: 'lisans.yetki_azalt'"));
  assert.ok(rights.includes('effectiveLicenseRights'));
  assert.ok(rights.includes('authorizationVersion: { increment: 1 }'));
});

await test('Yaptırım modu yalnız sahip + yeniden doğrulama ile değişiyor ve yetki sürümünü artırıyor', () => {
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/yaptirim/route.js'), 'utf8');
  assert.ok(route.includes("action: 'lisans.yaptirim_modu'"));
  assert.ok(route.includes('authorizationVersion: { increment: 1 }'));
  assert.ok(route.includes('appendLicenseEvent'));
  assert.ok(route.includes('current.status === \'iptal\''));
  assert.ok(!route.includes('reauthenticated:'));
});

await test('Sahip kullanıcı yönetimi kendini değiştirmiyor, oturumları iptal ediyor ve global olay zincirine yazıyor', () => {
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/kullanicilar/route.js'), 'utf8');
  const events = fs.readFileSync(path.join(ROOT, 'src/lib/license/events.mjs'), 'utf8');
  assert.ok(route.includes("action: 'yonetim.kullanici_yonet'"));
  assert.ok(route.includes("target.id === access.actor.id"));
  assert.ok(route.includes("target.licenseRole === 'sahip'"));
  assert.ok(route.includes('licenseAuthVersion: { increment: 1 }'));
  assert.ok(route.includes('adminSession.updateMany'));
  assert.ok(route.includes('appendLicenseEvent'));
  assert.ok(events.includes("{ licenseId: null }"));
});

await test('Bekleyen sipariş kalıcı silme yalnız sahip, yeniden doğrulama ve bağsız kayıtla açılıyor', () => {
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/siparisler/[id]/route.js'), 'utf8');
  const auth = fs.readFileSync(path.join(ROOT, 'src/lib/license/policy.mjs'), 'utf8');
  assert.ok(auth.includes("'siparis.kalici_sil'"));
  assert.ok(route.includes("action: 'siparis.kalici_sil'"));
  assert.ok(route.includes("z.literal('SİL')"));
  assert.ok(route.includes("order.status !== 'pending'"));
  assert.ok(route.includes('order._count.downloadInvites > 0'));
  assert.ok(route.includes('order.customerAccess'));
  assert.ok(route.includes('appendLicenseEvent'));
  assert.ok(route.indexOf("LICENSE_V1_ENABLED !== '1'") < route.indexOf('request.json()'));
});

await test('Google + Authenticator lisans oturumu Posta Merkezi erişiminde yeniden doğrulanıyor', () => {
  const auth = fs.readFileSync(path.join(ROOT, 'src/lib/auth.js'), 'utf8');
  const mail = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/posta/PostaClient.jsx'), 'utf8');
  const list = fs.readFileSync(path.join(ROOT, 'src/app/api/mail/route.js'), 'utf8');
  const send = fs.readFileSync(path.join(ROOT, 'src/app/api/mail/send/route.js'), 'utf8');
  assert.ok(auth.includes("payload.role === 'license_admin'"));
  assert.ok(auth.includes('authorizeLicenseRequest'));
  assert.ok(mail.includes("const LICENSE_TOKEN_KEY = 'h_license_jwt'"));
  assert.ok(mail.includes("'/api/mail/indirme-baglantisi'"));
  assert.ok(list.includes("await requireMailAccess(request, prisma, 'posta.goruntule')"));
  assert.ok(send.includes("await requireMailAccess(request, prisma, 'posta.gonder')"));
});

await test('Google + MFA oturum uçları genel ADMIN_TOKEN kabul etmiyor ve sırları yanıta geri taşımıyor', () => {
  const dir = path.join(ROOT, 'src/app/api/lisans/v1/yonetim/oturum');
  const combined = ['giris', 'mfa-baslat', 'mfa-dogrula', 'google-yapilandirma', 'google-baslat', 'google-dogrula', 'yeniden-dogrula', 'cikis']
    .map((name) => fs.readFileSync(path.join(dir, name, 'route.js'), 'utf8')).join('\n');
  assert.ok(!combined.includes('ADMIN_TOKEN'));
  assert.ok(combined.includes('licenseMfaPendingCipher'));
  assert.ok(combined.includes('recoveryCodes'));
  assert.ok(!combined.includes('licenseMfaSecretCipher: secret'));
});

await test('Lisans paneli yalnız Google sahip hesabı ardından MFA kabul ediyor; parola uçları üretimde kapanıyor', () => {
  const login = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/oturum/giris/route.js'), 'utf8');
  const googleStart = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/oturum/google-baslat/route.js'), 'utf8');
  const googleVerify = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/oturum/google-dogrula/route.js'), 'utf8');
  const reauth = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/oturum/yeniden-dogrula/route.js'), 'utf8');
  const client = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/lisans/LisansClient.jsx'), 'utf8');
  assert.ok(login.includes("LICENSE_GOOGLE_ONLY === '1'"));
  assert.ok(login.indexOf("LICENSE_GOOGLE_ONLY === '1'") < login.indexOf('request.json()'));
  assert.ok(googleStart.includes('verifyLicenseGoogleCredential'));
  assert.ok(googleStart.includes("identity.email !== ownerEmail"));
  assert.ok(googleStart.includes("user.licenseRole !== 'sahip'"));
  assert.ok(googleVerify.includes('licenseGoogleSub: fresh.licenseGoogleSub || claims.googleSub'));
  assert.ok(googleVerify.includes('verifySecondFactor'));
  assert.ok(!reauth.includes('passwordMatches'));
  assert.ok(reauth.includes('user?.licenseGoogleSub'));
  assert.ok(client.includes('https://accounts.google.com/gsi/client?hl=tr'));
  assert.ok(client.includes('/oturum/google-baslat'));
  assert.ok(client.includes('/oturum/google-dogrula'));
  assert.ok(!client.includes('type="password"'));
});

await test('Yeni tek lisans senkronu imzayı doğruluyor, çakışmayı reddediyor ve anahtarı saklamıyor', () => {
  const provision = fs.readFileSync(path.join(ROOT, 'prisma/license-provision.mjs'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(packageJson.scripts['license:provision'], 'node --env-file-if-exists=.env prisma/license-provision.mjs');
  assert.ok(provision.includes('raporOlustur'));
  assert.ok(provision.includes('if (!target.imzaGecerli)'));
  assert.ok(provision.includes('HERMES-YENI-LISANS-${plan.target.lisansNo}'));
  assert.ok(provision.includes('Lisans numarasi veya parmak izi baska kayitla cakisti'));
  assert.ok(provision.includes('Ayni uygulama ve cihazda etkin lisans var'));
  assert.ok(provision.includes("mode: 'provision-one'"));
  assert.ok(provision.includes('monitoringOnly: true'));
  assert.ok(provision.includes('appendLicenseEvent'));
  assert.ok(provision.includes('anahtarKonsolaYazilmadi: true'));
  assert.ok(!provision.includes('data: {\n        anahtar:'));
});

await test('Yayın beslemesi yalnız masaüstü eşleştirmesi, etkin lisans ve aktif cihaza GitHub asset adresi veriyor', () => {
  const start = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/masaustu/baslat/route.js'), 'utf8');
  const poll = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/masaustu/durum/route.js'), 'utf8');
  const update = fs.readFileSync(path.join(ROOT, 'src/app/api/guncelleme/windows/route.js'), 'utf8');
  const download = fs.readFileSync(path.join(ROOT, 'src/app/api/indir/windows/route.js'), 'utf8');
  const release = fs.readFileSync(path.join(ROOT, 'src/lib/releases.js'), 'utf8');
  const githubRelease = fs.readFileSync(path.join(ROOT, 'src/lib/github-release.mjs'), 'utf8');
  assert.ok(start.includes("x-hermes-desktop-client') !== 'kripto-yonetimi/1'"));
  assert.ok(start.includes("context: { path: ['ipHash'], equals: ipHash }"));
  assert.ok(poll.includes('LICENSE_DESKTOP_SESSION_MS'));
  assert.ok(poll.includes('claimedAt: now'));
  assert.ok(update.includes("status: { in: ['aktif', 'bakim'] }"));
  assert.ok(update.includes('expiresAt: { gt: new Date() }'));
  assert.ok(update.includes('deviceHash: grant.deviceHash, active: true'));
  assert.ok(update.includes("'Cache-Control': 'private, no-store'"));
  assert.ok(update.includes('githubReleaseAssetUrl(release)'));
  assert.ok(download.includes('githubReleaseAssetUrl(release)'));
  assert.ok(download.includes('return new Response(upstream.body'));
  assert.ok(!download.includes('NextResponse.redirect(downloadUrl'));
  assert.ok(githubRelease.includes("GITHUB_RELEASE_OWNER = 'zerdemkartal'"));
  assert.ok(githubRelease.includes("GITHUB_RELEASE_REPO = 'hermes-yayin'"));
  assert.ok(githubRelease.includes('/releases/latest/download/latest.yml'));
  assert.ok(githubRelease.includes('next: { revalidate: GITHUB_RELEASE_REVALIDATE_SECONDS }'));
  assert.ok(release.includes('fetchGithubLatestRelease()'));
  assert.ok(release.includes('Neon yedeği kullanılıyor'));
  assert.ok(release.includes('/releases/download/v${version}/${encodeURIComponent(fileName)}'));
  assert.ok(release.includes('export function githubReleaseAssetUrl'));
  // Özel Blob kopyası geri dönüş yedeği olarak tutulur.
  assert.ok(release.includes("operations: ['get']"));
  assert.ok(release.includes("access: 'private'"));
});

await test('GitHub Latest metadata sürüm, dosya, SHA-512, boyut ve tarihi güvenli biçimde çözüyor', () => {
  const sha512 = Buffer.alloc(64, 7).toString('base64');
  const release = parseGithubLatestYaml([
    'version: 1.7.5',
    'files:',
    '  - url: Hermes-Setup-1.7.5.exe',
    `    sha512: ${sha512}`,
    '    size: 138760664',
    'path: Hermes-Setup-1.7.5.exe',
    `sha512: ${sha512}`,
    "releaseDate: '2026-08-10T10:06:13.412Z'"
  ].join('\n'));
  assert.equal(release.version, '1.7.5');
  assert.equal(release.fileName, 'Hermes-Setup-1.7.5.exe');
  assert.equal(release.sha512, sha512);
  assert.equal(release.size, 138760664);
  assert.equal(release.publishedAt, '2026-08-10T10:06:13.412Z');
  assert.equal(release.source, 'github-latest');
  assert.throws(() => parseGithubLatestYaml([
    'version: 1.7.5',
    'path: Hermes-Setup-1.7.4.exe',
    `sha512: ${sha512}`,
    '  size: 138760664',
    "releaseDate: '2026-08-10T10:06:13.412Z'"
  ].join('\n')), /github-release-file-invalid/);
});

await test('Lisans yönetim yüzeyi rol-duyarlı, erişilebilir ve yalnız tema tokenlarıyla çiziliyor', () => {
  const client = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/lisans/LisansClient.jsx'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/lisans/lisans.module.css'), 'utf8');
  assert.ok(client.includes("const TOKEN_KEY = 'h_license_jwt'"));
  assert.ok(client.includes('aria-pressed={filter === item}'));
  assert.ok(client.includes('type="search"'));
  assert.ok(client.includes('row.customerEmail'));
  assert.ok(client.includes('row.customerRef'));
  assert.ok(client.includes('row.licenseNo'));
  assert.ok(client.includes('Aramana uyan lisans bulunamadı.'));
  assert.ok(client.includes("role === 'sahip'"));
  assert.ok(client.includes('confirmNo !== selected.licenseNo'));
  assert.ok(css.includes(':focus-visible'));
  assert.ok(css.includes('var(--h-accentbg)'));
  assert.ok(!/#[0-9a-f]{3,8}/i.test(css));
});

console.log(`\nSONUÇ: ${passed.length}/${passed.length} lisans sunucusu kapısı geçti.`);
