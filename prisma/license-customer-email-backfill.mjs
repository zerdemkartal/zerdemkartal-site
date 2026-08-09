import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HERMES_ROOT = path.resolve(HERE, '..', '..', '..', '..');
const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const CONFIRM = 'HERMES-LISANS-EPOSTA-AKTAR';

function managerDirectory() {
  const root = path.join(HERMES_ROOT, 'YARDIMCI PROGRAMLAR');
  const names = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^13-/.test(entry.name));
  if (names.length !== 1) throw new Error('Lisans yoneticisi klasoru tekil bulunamadi');
  return path.join(root, names[0].name);
}

function sourceEmails() {
  const ledger = JSON.parse(fs.readFileSync(path.join(managerDirectory(), 'musteriler.json'), 'utf8'));
  const result = new Map();
  for (const row of ledger) {
    const licenseNo = String(row?.lisansNo || '').trim().toUpperCase();
    const email = String(row?.email || '').trim().toLowerCase();
    if (/^[A-Z0-9]{6}\d{10}(?:-\d{2,})?$/.test(licenseNo) && email && email.includes('@')) {
      result.set(licenseNo, email.slice(0, 254));
    }
  }
  return result;
}

async function main() {
  const source = sourceEmails();
  const licenses = await prisma.license.findMany({
    select: { id: true, licenseNo: true, customerEmail: true }
  });
  const updates = [];
  let alreadyPresent = 0;
  let conflict = 0;
  for (const license of licenses) {
    const email = source.get(license.licenseNo);
    if (!email) continue;
    if (!license.customerEmail) updates.push({ id: license.id, email });
    else if (license.customerEmail.toLowerCase() === email) alreadyPresent += 1;
    else conflict += 1;
  }
  const summary = {
    serverLicenseCount: licenses.length,
    sourceEmailCount: source.size,
    updateCount: updates.length,
    alreadyPresent,
    conflict,
    withoutExactEmailSource: licenses.length - updates.length - alreadyPresent - conflict
  };
  if (!APPLY) {
    console.log(JSON.stringify({ mode: 'dry-run', ...summary }, null, 2));
    return;
  }
  if (process.env.LICENSE_CUSTOMER_EMAIL_BACKFILL_CONFIRM !== CONFIRM) {
    throw new Error(`--apply icin LICENSE_CUSTOMER_EMAIL_BACKFILL_CONFIRM=${CONFIRM} gerekli`);
  }
  if (conflict) throw new Error('Mevcut e-posta ile kaynak defter arasinda cakisma var');
  await prisma.$transaction(updates.map((item) => prisma.license.updateMany({
    where: { id: item.id, customerEmail: null },
    data: { customerEmail: item.email }
  })));
  console.log(JSON.stringify({ mode: 'apply', complete: true, ...summary }, null, 2));
}

main().catch((error) => {
  console.error('Lisans e-posta aktarimi basarisiz: ' + error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
