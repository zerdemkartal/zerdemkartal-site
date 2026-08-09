import { issueSignedToken, presignUrl } from '@vercel/blob';
import { prisma } from '@/lib/db';

export const GITHUB_RELEASE_OWNER = 'zerdemkartal';
export const GITHUB_RELEASE_REPO = 'hermes-yayin';

export async function getLatestRelease(application = 'hermes', platform = 'windows') {
  const row = await prisma.releaseArtifact.findFirst({
    where: { application, platform, active: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
  });
  if (!row) return null;
  return {
    id: row.id,
    version: row.version,
    fileName: row.fileName,
    blobPath: row.blobPath,
    sha512: row.sha512,
    size: Number(row.size),
    publishedAt: row.publishedAt.toISOString()
  };
}

export async function privateReleaseUrl(release, validityMs = 10 * 60 * 1000) {
  if (!release?.blobPath) throw new Error('release-missing');
  const validUntil = Date.now() + Math.max(60_000, Math.min(validityMs, 60 * 60 * 1000));
  const signed = await issueSignedToken({
    pathname: release.blobPath,
    operations: ['get'],
    validUntil
  });
  const result = await presignUrl(signed, {
    access: 'private',
    operation: 'get',
    pathname: release.blobPath,
    validUntil
  });
  return result.presignedUrl;
}

export function githubReleaseAssetUrl(release) {
  const version = String(release?.version || '').trim();
  const fileName = String(release?.fileName || '').trim();
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error('release-missing');
  if (!fileName || fileName === '.' || fileName === '..' || /[\\/\0]/.test(fileName)) {
    throw new Error('release-missing');
  }
  return `https://github.com/${GITHUB_RELEASE_OWNER}/${GITHUB_RELEASE_REPO}/releases/download/v${version}/${encodeURIComponent(fileName)}`;
}
