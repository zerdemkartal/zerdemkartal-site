import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import {
  DOWNLOAD_INVITE_MS,
  DOWNLOAD_LOCK_MS,
  DOWNLOAD_MAX_FAILURES,
  DOWNLOAD_SESSION_MS,
  createDownloadInvite,
  createDownloadPassword,
  downloadSecretHash,
  findDownloadSession,
  verifyDownloadInvite
} from '../src/lib/download-invite.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HERMES = path.resolve(ROOT, '..', '..', '..');
const passed = [];
async function test(name, fn) {
  await fn();
  passed.push(name);
  console.log('✓ ' + name);
}

function fakeDatabase(initialInvites = []) {
  const invites = [...initialInvites];
  const sessions = [];
  let sequence = 0;
  const database = {
    $executeRaw: async () => 1,
    $transaction: async (fn) => fn(database),
    downloadInvite: {
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const invite of invites) {
          const matchesApplication = !where.application || invite.application === where.application;
          const matchesRevoked = where.revokedAt !== null || invite.revokedAt === null;
          const matchesOr = !where.OR || where.OR.some((item) => (
            (item.orderId && item.orderId === invite.orderId) ||
            (item.email && item.email === invite.email)
          ));
          if (matchesApplication && matchesRevoked && matchesOr) {
            Object.assign(invite, data); count += 1;
          }
        }
        return { count };
      },
      create: async ({ data }) => {
        const invite = {
          id: `invite-${++sequence}`,
          failedAttempts: 0,
          lockedUntil: null,
          openedAt: null,
          sentAt: null,
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data
        };
        invites.push(invite);
        return invite;
      },
      findUnique: async ({ where }) => invites.find((item) => (
        (where.linkTokenHash && item.linkTokenHash === where.linkTokenHash) ||
        (where.id && item.id === where.id)
      )) || null,
      update: async ({ where, data }) => {
        const invite = invites.find((item) => item.id === where.id);
        Object.assign(invite, data);
        return invite;
      }
    },
    downloadSession: {
      create: async ({ data }) => {
        const session = { id: `session-${sessions.length + 1}`, revokedAt: null, createdAt: new Date(), ...data };
        sessions.push(session);
        return session;
      },
      findUnique: async ({ where }) => {
        const session = sessions.find((item) => item.tokenHash === where.tokenHash);
        if (!session) return null;
        return { ...session, invite: invites.find((item) => item.id === session.inviteId) };
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const session of sessions) {
          if (session.inviteId === where.inviteId && !session.revokedAt) {
            Object.assign(session, data); count += 1;
          }
        }
        return { count };
      }
    }
  };
  return { database, invites, sessions };
}

await test('72 saatlik davet kişisel veriden türemeyen sırlar üretip yalnız özetlerini saklıyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const { database, invites } = fakeDatabase();
  const created = await createDownloadInvite({
    database, name: 'Zerdem Kartal', email: 'ZERDEM@EXAMPLE.COM', now
  });
  assert.match(created.temporaryPassword, /^[A-HJ-NP-Za-km-z2-9]{4}(?:-[A-HJ-NP-Za-km-z2-9]{4}){3}$/);
  assert.equal(created.passwordExpiresAt.getTime() - now.getTime(), DOWNLOAD_INVITE_MS);
  assert.equal(invites[0].email, 'zerdem@example.com');
  assert.notEqual(invites[0].passwordHash, created.temporaryPassword);
  assert.notEqual(invites[0].linkTokenHash, created.linkToken);
  assert.equal(invites[0].linkTokenHash.length, 64);
  assert.ok(await bcrypt.compare(created.temporaryPassword, invites[0].passwordHash));
  assert.notEqual(createDownloadPassword(), createDownloadPassword());
});

await test('Doğru geçici şifre 30 dakikalık özetli oturum açıyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const { database, sessions } = fakeDatabase();
  const created = await createDownloadInvite({ database, name: 'Yunus Test', email: 'yunus@example.com', now });
  const result = await verifyDownloadInvite({
    database, linkToken: created.linkToken, password: created.temporaryPassword, now
  });
  assert.equal(result.ok, true);
  assert.equal(result.expiresAt.getTime() - now.getTime(), DOWNLOAD_SESSION_MS);
  assert.equal(sessions.length, 1);
  assert.notEqual(sessions[0].tokenHash, result.sessionToken);
  assert.ok(await findDownloadSession({ database, sessionToken: result.sessionToken, now }));
  assert.equal(await findDownloadSession({
    database, sessionToken: result.sessionToken, now: new Date(now.getTime() + DOWNLOAD_SESSION_MS + 1)
  }), null);
});

await test('Beşinci yanlış geçici şifre daveti 15 dakika kilitliyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const linkToken = 'a'.repeat(43);
  const invite = {
    id: 'locked-invite', application: 'hermes', email: 'test@example.com', orderId: null,
    linkTokenHash: downloadSecretHash(linkToken, 'link'),
    passwordHash: await bcrypt.hash('Dogru-Parola-2026', 4),
    passwordExpiresAt: new Date(now.getTime() + DOWNLOAD_INVITE_MS),
    failedAttempts: DOWNLOAD_MAX_FAILURES - 1, lockedUntil: null, openedAt: null, revokedAt: null
  };
  const { database } = fakeDatabase([invite]);
  const result = await verifyDownloadInvite({ database, linkToken, password: 'yanlis-parola', now });
  assert.equal(result.status, 429);
  assert.equal(result.reason, 'indirme-daveti-kilitli');
  assert.equal(invite.lockedUntil.getTime() - now.getTime(), DOWNLOAD_LOCK_MS);
});

await test('Süresi dolmuş davet doğru şifreyle bile indirmeyi açmıyor', async () => {
  const now = new Date('2026-08-02T09:00:00.000Z');
  const linkToken = 'b'.repeat(43);
  const invite = {
    id: 'expired-invite', application: 'hermes', email: 'test@example.com', orderId: null,
    linkTokenHash: downloadSecretHash(linkToken, 'link'),
    passwordHash: await bcrypt.hash('Dogru-Parola-2026', 4),
    passwordExpiresAt: new Date(now.getTime() - 1), failedAttempts: 0,
    lockedUntil: null, openedAt: null, revokedAt: null
  };
  const { database } = fakeDatabase([invite]);
  const result = await verifyDownloadInvite({ database, linkToken, password: 'Dogru-Parola-2026', now });
  assert.equal(result.status, 410);
  assert.equal(result.reason, 'indirme-daveti-suresi-doldu');
});

await test('İndirme kapısı oturum istiyor; makine kimliği Vercel akışına girmiyor', () => {
  const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf8');
  const email = fs.readFileSync(path.join(ROOT, 'src/lib/email.js'), 'utf8');
  const accessRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/indir/erisim/route.js'), 'utf8');
  const downloadRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/indir/windows/route.js'), 'utf8');
  const downloadUi = fs.readFileSync(path.join(ROOT, 'src/components/DownloadAccess.jsx'), 'utf8');
  const requestRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/istek/route.js'), 'utf8');
  const desktop = fs.readFileSync(path.join(HERMES, 'main.js'), 'utf8');
  assert.ok(schema.includes('model DownloadInvite'));
  assert.ok(schema.includes('linkTokenHash'));
  assert.ok(!schema.includes('temporaryPassword String'));
  assert.ok(email.includes('/indir#d='));
  assert.ok(email.includes('72 saatlik geçici indirme şifren'));
  assert.ok(accessRoute.includes('httpOnly: true'));
  assert.ok(accessRoute.includes("sameSite: 'lax'"));
  assert.ok(downloadRoute.includes('findDownloadSession'));
  assert.ok(downloadUi.includes("fetch('/api/indir/erisim'"));
  assert.ok(!downloadUi.includes('github.com'));
  assert.ok(requestRoute.includes('status: 410'));
  assert.ok(!requestRoute.includes('request.json'));
  assert.ok(desktop.includes("op: 'istek'"));
  assert.ok(desktop.includes('makineId: makineIdAl()'));
});

await test('Birleşik yönetici EFT ve manuel daveti ayrı yetkiyle koruyor, sırları listelemiyor', () => {
  const policy = fs.readFileSync(path.join(ROOT, 'src/lib/license/policy.mjs'), 'utf8');
  const manual = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/indirme-daveti/route.js'), 'utf8');
  const eft = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/siparisler/[id]/eft-onay/route.js'), 'utf8');
  const list = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/siparisler/route.js'), 'utf8');
  const panel = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/lisans/LisansClient.jsx'), 'utf8');
  const paymentPage = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/odemeler/page.jsx'), 'utf8');
  const deleteRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/lisans/v1/yonetim/siparisler/[id]/route.js'), 'utf8');
  assert.ok(policy.includes("'indirme.davet_gonder'"));
  assert.ok(manual.includes("action: 'indirme.davet_gonder'"));
  assert.ok(manual.indexOf("LICENSE_V1_ENABLED !== '1'") < manual.indexOf('request.json()'));
  assert.ok(eft.includes("action: 'siparis.eft_onayla'"));
  assert.ok(eft.includes('createDownloadInvite'));
  assert.ok(eft.includes('paymentConfirmedEmail(prepared.order, downloadAccess)'));
  assert.ok(!list.includes('passwordHash: true'));
  assert.ok(!list.includes('linkTokenHash: true'));
  assert.ok(list.includes('prisma.paymentReceipt.findMany'));
  assert.ok(list.includes('paytrMakbuzlari: paytrReceipts'));
  assert.ok(!list.includes('callbackId: true'));
  assert.ok(panel.includes('İNDİRME YÖNETİCİSİ'));
  assert.ok(panel.includes('PAYTR · ANONİM KAYIT'));
  assert.ok(panel.includes('Müşteri, iletişim, adres ve kart bilgisi tutulmaz.'));
  assert.ok(panel.includes('setPaytrReceipts(data.paytrMakbuzlari || [])'));
  assert.ok(panel.includes('İndirme linki gönder'));
  assert.ok(panel.includes('EFT ödemesi alındı'));
  assert.ok(paymentPage.includes('mode="payments"'));
  assert.ok(panel.includes('isPayments && mayOrders'));
  assert.ok(deleteRoute.includes("action: 'siparis.kalici_sil'"));
  assert.ok(deleteRoute.includes("z.literal('SİL')"));
  assert.ok(deleteRoute.includes('order._count.requests > 0'));
  assert.ok(deleteRoute.includes('appendLicenseEvent'));
});

await test('Satın alma akışı kişisel veri toplamadan PayTR Link veya EFT seçtiriyor', () => {
  const form = fs.readFileSync(path.join(ROOT, 'src/app/satin-al/SatinAlForm.jsx'), 'utf8');
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/purchase-request/route.js'), 'utf8');
  const legal = fs.readFileSync(path.join(ROOT, 'src/app/yasal/[slug]/page.jsx'), 'utf8');
  assert.ok(form.includes("fetch('/api/pay/paytr/link'"));
  assert.ok(form.includes('EFT/Havale bilgilerini iste'));
  assert.ok(!form.includes('name="taxNumber"'));
  assert.ok(!form.includes('name="billingAddress"'));
  assert.ok(!form.includes('firstName'));
  assert.ok(route.includes('status: 410'));
  assert.ok(!route.includes('request.json'));
  assert.ok(legal.toLocaleLowerCase('tr-TR').includes('anonim ödeme mutabakatı'));
  assert.ok(legal.includes('Kart bilgileri Hermes sunucularına girilmez'));
});

await test('Kripto Yönetimi elle verilen lisans numarasını koruyor', () => {
  const core = fs.readFileSync(path.join(HERMES, 'YARDIMCI PROGRAMLAR', '13- Kripto Yönetim Dosyası', 'lisans-cekirdek.js'), 'utf8');
  const bridge = fs.readFileSync(path.join(HERMES, 'YARDIMCI PROGRAMLAR', '13- Kripto Yönetim Dosyası', 'apps-script.gs'), 'utf8');
  const manager = fs.readFileSync(path.join(HERMES, 'YARDIMCI PROGRAMLAR', '13- Kripto Yönetim Dosyası', 'index.html'), 'utf8');
  assert.ok(core.includes("const ayrilanLisansNo = String(opts.lisansNo || '')"));
  assert.ok(core.includes('lisansNo: ayrilanLisansNo ||'));
  assert.ok(bridge.includes("'lisansNo'"));
  assert.ok(manager.includes("lisansNo: b.lisansNo || ''"));
});

console.log(`\nSONUÇ: ${passed.length}/${passed.length} güvenli indirme daveti kapısı geçti.`);
