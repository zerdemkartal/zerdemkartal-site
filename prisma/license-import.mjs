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
const CONFIRM = 'HERMES-51-LISANS-AKTAR';

function managerDirectory() {
  const root = path.join(HERMES_ROOT, 'YARDIMCI PROGRAMLAR');
  const names = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^13-/.test(entry.name));
  if (names.length !== 1) throw new Error('Lisans yoneticisi klasoru tekil bulunamadi');
  return path.join(root, names[0].name);
}

function optionalExpiry(value) {
  const text = String(value || '').trim().toLocaleLowerCase('tr-TR');
  if (!text || text === 'süresiz' || text === 'suresiz') return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Gecersiz lisans bitis tarihi');
  return date;
}

function customerReference(row) {
  return `${String(row?.ad || '').trim()} ${String(row?.soyad || '').trim()}`.trim().slice(0, 200) || null;
}

function customerEmail(row) {
  return String(row?.email || '').trim().toLowerCase().slice(0, 254) || null;
}

function buildPlan() {
  const manager = managerDirectory();
  const ledgerPath = path.join(manager, 'musteriler.json');
  const report = preview.raporOlustur({
    defter: ledgerPath,
    acikAnahtar: path.join(manager, 'acik-anahtar.pem'),
    gizliAnahtar: path.join(manager, 'gizli-anahtar.pem')
  });
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const allowedIssues = new Set(['lisans-parmak-izi-tekrarli', 'ayni-cihazda-daha-yeni-lisans-var']);
  const unexpected = report.kayitlar.flatMap((row) => row.sorunlar)
    .filter((issue) => !allowedIssues.has(issue.kod));
  if (unexpected.length) throw new Error('Gecis raporunda beklenmeyen hata veya inceleme var');
  if (report.ozet.kayitSayisi !== 51 || report.ozet.imzasiGecerliKayit !== 51 ||
      report.ozet.benzersizLisansNo !== 51 || report.ozet.benzersizParmakIzi !== 48 ||
      report.ozet.aliasKaydiSayisi !== 3 || report.ozet.oncekiLisansAdayiSayisi !== 2) {
    throw new Error('51 lisans gecis sozlesmesi degisti');
  }

  const previousLicenseNos = new Set(report.siniflandirma.yenilemeGruplari
    .flatMap((group) => group.oncekiLisansNolari));
  const groups = new Map();
  for (const row of report.kayitlar) {
    if (!groups.has(row.lisansParmakIzi)) groups.set(row.lisansParmakIzi, []);
    groups.get(row.lisansParmakIzi).push(row);
  }
  const licenses = [...groups.values()].map((rows) => {
    rows.sort((a, b) => String(a.verilis).localeCompare(String(b.verilis)) || a.sira - b.sira);
    const canonical = rows[0];
    const source = ledger[canonical.sira - 1];
    return {
      canonical,
      source,
      previousRenewal: previousLicenseNos.has(canonical.lisansNo),
      aliases: rows.slice(1)
    };
  });
  return { report, licenses };
}

function publicSummary(plan) {
  return {
    kaynakSatir: plan.report.ozet.kayitSayisi,
    gercekLisans: plan.licenses.length,
    alias: plan.report.ozet.aliasKaydiSayisi,
    hermes: plan.report.ozet.uygulamalar.hermes,
    astropen: plan.report.ozet.uygulamalar.astropen,
    yenilemeIncelemesi: plan.report.ozet.oncekiLisansAdayiSayisi,
    imzaGecerli: plan.report.ozet.imzasiGecerliKayit,
    kaynakSha256: plan.report.kaynaklar.musteriDefteri.sha256,
    politika: {
      izlemeModu: true,
      cihazlarKaynakDefterdenBagli: true,
      yenilemeDurumuOtomatikDegismedi: true,
      kaynakSatirSilinmedi: true
    }
  };
}

async function applyPlan(plan) {
  if (process.env.LICENSE_IMPORT_CONFIRM !== CONFIRM) {
    throw new Error(`--apply icin LICENSE_IMPORT_CONFIRM=${CONFIRM} gerekli`);
  }
  const ownerEmail = String(process.env.LICENSE_OWNER_EMAIL || '').trim().toLowerCase();
  if (!ownerEmail) throw new Error('LICENSE_OWNER_EMAIL gerekli');
  const summary = publicSummary(plan);

  return prisma.$transaction(async (tx) => {
    const owner = await tx.adminUser.findUnique({ where: { email: ownerEmail } });
    if (!owner?.licenseActive || owner.licenseRole !== 'sahip') throw new Error('Etkin lisans sahibi bulunamadi');
    const existingImport = await tx.licenseImport.findUnique({
      where: { sourceHash: plan.report.kaynaklar.musteriDefteri.sha256 }
    });
    if (existingImport) throw new Error('Bu kaynak daha once aktarildi');
    if (await tx.license.count() || await tx.licenseAlias.count()) {
      throw new Error('Hedef lisans tablolari bos degil; otomatik birlestirme reddedildi');
    }

    const importedAt = new Date();
    const importRow = await tx.licenseImport.create({
      data: {
        sourceHash: plan.report.kaynaklar.musteriDefteri.sha256,
        mode: 'apply',
        status: 'uygulaniyor',
        summary,
        createdById: owner.id
      }
    });

    for (const item of plan.licenses) {
      const issuedAt = new Date(item.canonical.verilis);
      if (!Number.isFinite(issuedAt.getTime())) throw new Error('Gecersiz verilis tarihi');
      const features = [...item.canonical.yetkiTavani.taninanOzellikler];
      const license = await tx.license.create({
        data: {
          licenseNo: item.canonical.lisansNo,
          fingerprint: item.canonical.lisansParmakIzi,
          application: item.canonical.uygulama,
          customerRef: customerReference(item.source),
          customerEmail: customerEmail(item.source),
          issuedAt,
          expiresAt: optionalExpiry(item.canonical.bitis),
          status: 'aktif',
          statusReason: item.previousRenewal ? 'gecis-incelemesi: ayni cihazda daha yeni lisans var' : null,
          statusChangedAt: importedAt,
          signedLevel: item.canonical.yetkiTavani.seviye,
          signedFeatures: features,
          remoteLevel: item.canonical.yetkiTavani.seviye,
          remoteFeatures: features,
          authorizationVersion: 1,
          deviceLimit: 1,
          monitoringOnly: true,
          sourceImportId: importRow.id,
          aliases: {
            create: item.aliases.map((alias) => ({ licenseNo: alias.lisansNo, sourceRow: alias.sira }))
          },
          devices: {
            create: [{
              deviceHash: item.canonical.cihazKimligi,
              active: true,
              firstSeenAt: issuedAt,
              lastSeenAt: issuedAt
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
        reason: item.previousRenewal ? 'kaynak defter aktarimi; yenileme incelemesi acik' : 'kaynak defter aktarimi',
        beforeState: null,
        afterState: {
          durum: license.status,
          uygulama: license.application,
          izlemeModu: license.monitoringOnly,
          aliasSayisi: item.aliases.length,
          cihazBagli: true
        },
        requestId: crypto.randomUUID(),
        createdAt: importedAt
      });
    }
    await tx.licenseImport.update({
      where: { id: importRow.id },
      data: { status: 'tamamlandi-incelemeli', committedAt: importedAt }
    });
    return summary;
  }, { timeout: 120000 });
}

async function main() {
  const plan = buildPlan();
  const summary = publicSummary(plan);
  if (!APPLY) {
    const existing = await prisma.licenseImport.findUnique({
      where: { sourceHash: plan.report.kaynaklar.musteriDefteri.sha256 },
      select: { status: true, committedAt: true }
    });
    console.log(JSON.stringify({ mod: 'dry-run', ...summary, hedefteAyniKaynak: existing || null }, null, 2));
    return;
  }
  const applied = await applyPlan(plan);
  console.log(JSON.stringify({ mod: 'apply', tamam: true, ...applied }, null, 2));
}

main().catch((error) => {
  console.error('Lisans aktarimi basarisiz: ' + error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
