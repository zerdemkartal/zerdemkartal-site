import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { appendLicenseEvent } from '../src/lib/license/events.mjs';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const HERMES_ROOT = path.resolve(HERE, '..', '..', '..', '..');
const preview = require(path.join(HERMES_ROOT, 'motor', 'araclar', 'lisans_gecis_onizleme.js'));
const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || '').trim() : '';
}

function managerDirectory() {
  const root = path.join(HERMES_ROOT, 'YARDIMCI PROGRAMLAR');
  const names = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^13-/.test(entry.name));
  if (names.length !== 1) throw new Error('Lisans yoneticisi klasoru tekil bulunamadi');
  return path.join(root, names[0].name);
}

function expiry(value) {
  const text = String(value || '').trim().toLocaleLowerCase('tr-TR');
  if (!text || text === 'süresiz' || text === 'suresiz') return null;
  const result = new Date(value);
  if (!Number.isFinite(result.getTime())) throw new Error('Gecersiz lisans bitis tarihi');
  return result;
}

function customerReference(row) {
  return `${String(row?.ad || '').trim()} ${String(row?.soyad || '').trim()}`.trim().slice(0, 200) || null;
}

function customerEmail(row) {
  return String(row?.email || '').trim().toLowerCase().slice(0, 254) || null;
}

function targetPlan(licenseNo) {
  if (!/^[A-Z0-9]{6}\d{10}(?:-\d{2,})?$/.test(licenseNo)) throw new Error('Gecerli --license-no gerekli');
  const manager = managerDirectory();
  const ledgerPath = path.join(manager, 'musteriler.json');
  const report = preview.raporOlustur({
    defter: ledgerPath,
    acikAnahtar: path.join(manager, 'acik-anahtar.pem')
  });
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const target = report.kayitlar.find((row) => row.lisansNo === licenseNo);
  if (!target) throw new Error('Lisans defterde bulunamadi');
  if (!target.imzaGecerli) throw new Error('Lisans imzasi gecersiz');
  const blocking = target.sorunlar.filter((issue) =>
    issue.seviye === 'hata' || !['ayni-cihazda-daha-yeni-lisans-var'].includes(issue.kod)
  );
  if (blocking.length) throw new Error('Lisans kaydi guvenli senkrona uygun degil: ' + blocking.map((x) => x.kod).join(','));
  if (target.yetkiTavani.bilinmeyenOzellikler.length) throw new Error('Bilinmeyen imzali yetki bayragi var');
  const source = ledger[target.sira - 1];
  const issuedAt = new Date(target.verilis);
  if (!Number.isFinite(issuedAt.getTime())) throw new Error('Gecersiz verilis tarihi');
  return {
    target,
    source,
    issuedAt,
    expiresAt: expiry(target.bitis),
    sourceHash: report.kaynaklar.musteriDefteri.sha256,
    features: [...target.yetkiTavani.taninanOzellikler]
  };
}

async function inspect(plan) {
  const [byNumber, byFingerprint, deviceCollision] = await Promise.all([
    prisma.license.findUnique({ where: { licenseNo: plan.target.lisansNo }, select: { id: true, fingerprint: true } }),
    prisma.license.findUnique({ where: { fingerprint: plan.target.lisansParmakIzi }, select: { id: true, licenseNo: true } }),
    prisma.licenseDevice.findFirst({
      where: {
        deviceHash: plan.target.cihazKimligi,
        active: true,
        license: { application: plan.target.uygulama }
      },
      select: { license: { select: { licenseNo: true } } }
    })
  ]);
  return { byNumber, byFingerprint, deviceCollision };
}

async function apply(plan) {
  const expectedConfirm = `HERMES-YENI-LISANS-${plan.target.lisansNo}`;
  if (process.env.LICENSE_PROVISION_CONFIRM !== expectedConfirm) {
    throw new Error(`--apply icin LICENSE_PROVISION_CONFIRM=${expectedConfirm} gerekli`);
  }
  const ownerEmail = String(process.env.LICENSE_OWNER_EMAIL || '').trim().toLowerCase();
  if (!ownerEmail) throw new Error('LICENSE_OWNER_EMAIL gerekli');

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-provision:${plan.target.lisansParmakIzi}`}))`;
    const owner = await tx.adminUser.findUnique({ where: { email: ownerEmail } });
    if (!owner?.licenseActive || owner.licenseRole !== 'sahip') throw new Error('Etkin lisans sahibi bulunamadi');

    const existing = await tx.license.findFirst({
      where: { OR: [{ licenseNo: plan.target.lisansNo }, { fingerprint: plan.target.lisansParmakIzi }] }
    });
    if (existing) {
      if (existing.licenseNo === plan.target.lisansNo && existing.fingerprint === plan.target.lisansParmakIzi) {
        return { created: false, licenseNo: existing.licenseNo, status: existing.status };
      }
      throw new Error('Lisans numarasi veya parmak izi baska kayitla cakisti');
    }
    const deviceCollision = await tx.licenseDevice.findFirst({
      where: {
        deviceHash: plan.target.cihazKimligi,
        active: true,
        license: { application: plan.target.uygulama }
      },
      select: { license: { select: { licenseNo: true } } }
    });
    if (deviceCollision) throw new Error('Ayni uygulama ve cihazda etkin lisans var; insan incelemesi gerekli');

    const importedAt = new Date();
    const importRow = await tx.licenseImport.create({
      data: {
        sourceHash: plan.sourceHash,
        mode: 'provision-one',
        status: 'uygulaniyor',
        summary: {
          lisansNo: plan.target.lisansNo,
          kaynakSatir: plan.target.sira,
          uygulama: plan.target.uygulama,
          seviye: plan.target.yetkiTavani.seviye,
          ozellikSayisi: plan.features.length,
          izlemeModu: true,
          anahtarSaklanmadi: true
        },
        createdById: owner.id
      }
    });
    const license = await tx.license.create({
      data: {
        licenseNo: plan.target.lisansNo,
        fingerprint: plan.target.lisansParmakIzi,
        application: plan.target.uygulama,
        customerRef: customerReference(plan.source),
        customerEmail: customerEmail(plan.source),
        issuedAt: plan.issuedAt,
        expiresAt: plan.expiresAt,
        status: 'aktif',
        statusReason: 'yeni lisans defter senkronu',
        statusChangedAt: importedAt,
        signedLevel: plan.target.yetkiTavani.seviye,
        signedFeatures: plan.features,
        remoteLevel: plan.target.yetkiTavani.seviye,
        remoteFeatures: plan.features,
        authorizationVersion: 1,
        deviceLimit: 1,
        monitoringOnly: true,
        sourceImportId: importRow.id,
        devices: {
          create: [{
            deviceHash: plan.target.cihazKimligi,
            active: true,
            firstSeenAt: plan.issuedAt,
            lastSeenAt: plan.issuedAt
          }]
        }
      }
    });
    await appendLicenseEvent(tx, {
      licenseId: license.id,
      actorId: owner.id,
      actorRole: owner.licenseRole,
      action: 'lisans.aktar',
      outcome: 'basarili',
      reason: 'yeni lisans defter senkronu',
      beforeState: null,
      afterState: {
        durum: license.status,
        uygulama: license.application,
        izlemeModu: license.monitoringOnly,
        cihazBagli: true,
        seviye: license.signedLevel,
        ozellikSayisi: plan.features.length
      },
      requestId: crypto.randomUUID(),
      createdAt: importedAt
    });
    await tx.licenseImport.update({
      where: { id: importRow.id },
      data: { status: 'tamamlandi', committedAt: importedAt }
    });
    return { created: true, licenseNo: license.licenseNo, status: license.status };
  }, { timeout: 30000 });
}

async function main() {
  const plan = targetPlan(argument('--license-no').toUpperCase());
  const existing = await inspect(plan);
  const publicResult = {
    lisansNo: plan.target.lisansNo,
    uygulama: plan.target.uygulama,
    seviye: plan.target.yetkiTavani.seviye,
    ozellikSayisi: plan.features.length,
    suresiz: plan.expiresAt === null,
    imzaGecerli: plan.target.imzaGecerli,
    hedefteAyniLisans: Boolean(existing.byNumber && existing.byFingerprint &&
      existing.byNumber.id === existing.byFingerprint.id),
    cihazCakismasi: existing.deviceCollision?.license?.licenseNo || null,
    anahtarKonsolaYazilmadi: true,
    cihazKimligiKonsolaYazilmadi: true
  };
  if (!APPLY) {
    console.log(JSON.stringify({ mod: 'dry-run', ...publicResult }, null, 2));
    return;
  }
  const result = await apply(plan);
  console.log(JSON.stringify({ mod: 'apply', tamam: true, ...publicResult, ...result }, null, 2));
}

main().catch((error) => {
  console.error('Yeni lisans senkronu basarisiz: ' + error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
