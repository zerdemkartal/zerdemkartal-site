import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function arg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || '') : fallback;
}

const file = path.resolve(arg('file'));
const version = arg('version');
const blobPath = arg('blob-path');
const application = arg('application', 'hermes').toLowerCase();
const platform = arg('platform', 'windows').toLowerCase();

if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error('Geçerli --file gerekli.');
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Geçerli --version gerekli.');
if (!/^hermes\/windows\/\d+\.\d+\.\d+\/[A-Za-z0-9._-]+\.exe$/.test(blobPath)) throw new Error('Güvenli --blob-path biçimi gerekli.');

const bytes = fs.readFileSync(file);
const sha512 = crypto.createHash('sha512').update(bytes).digest('base64');
const size = BigInt(bytes.length);
const fileName = path.basename(file);

try {
  const release = await prisma.$transaction(async (tx) => {
    await tx.releaseArtifact.updateMany({
      where: { application, platform, active: true },
      data: { active: false }
    });
    return tx.releaseArtifact.upsert({
      where: { application_platform_version: { application, platform, version } },
      create: { application, platform, version, fileName, blobPath, sha512, size, active: true },
      update: { fileName, blobPath, sha512, size, active: true, publishedAt: new Date() }
    });
  });
  console.log(JSON.stringify({
    ok: true,
    id: release.id,
    application: release.application,
    platform: release.platform,
    version: release.version,
    blobPath: release.blobPath,
    sha512: release.sha512,
    size: Number(release.size),
    active: release.active
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
