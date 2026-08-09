import { prisma } from '@/lib/db';
import { getLatestRelease, githubReleaseAssetUrl } from '@/lib/releases';
import { verifyUpdateGrant } from '@/lib/license/update-grant.mjs';

export const dynamic = 'force-dynamic';

function bearer(request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

export async function GET(request) {
  let grant;
  try { grant = verifyUpdateGrant(bearer(request), process.env.JWT_SECRET); }
  catch { return new Response('unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } }); }
  if (grant.application !== 'hermes') return new Response('forbidden', { status: 403 });
  const license = await prisma.license.findFirst({
    where: {
      fingerprint: grant.fingerprint,
      application: 'hermes',
      status: { in: ['aktif', 'bakim'] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      devices: { some: { deviceHash: grant.deviceHash, active: true } }
    },
    select: { id: true }
  });
  if (!license) return new Response('forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const release = await getLatestRelease('hermes', 'windows');
  if (!release) return new Response('release unavailable', { status: 503, headers: { 'Retry-After': '300' } });
  let url;
  try { url = githubReleaseAssetUrl(release); }
  catch { return new Response('release unavailable', { status: 503, headers: { 'Retry-After': '300' } }); }
  const yaml = [
    `version: ${release.version}`,
    'files:',
    `  - url: ${JSON.stringify(url)}`,
    `    sha512: ${release.sha512}`,
    `    size: ${release.size}`,
    `path: ${JSON.stringify(url)}`,
    `sha512: ${release.sha512}`,
    `releaseDate: ${JSON.stringify(release.publishedAt)}`,
    ''
  ].join('\n');
  return new Response(yaml, {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
