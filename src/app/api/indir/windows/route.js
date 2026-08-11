import { NextResponse } from 'next/server';
import { getLatestRelease, githubReleaseAssetUrl } from '@/lib/releases';
import { prisma } from '@/lib/db';
import { DOWNLOAD_SESSION_COOKIE, findDownloadSession } from '@/lib/download-invite.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function downloadHeaders(release, upstream) {
  const fileName = String(release.fileName || 'Hermes-Setup.exe').replace(/[\r\n"\\/]/g, '-');
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  });
  for (const name of ['accept-ranges', 'content-length', 'content-range', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export async function GET(request) {
  const sessionToken = request.cookies.get(DOWNLOAD_SESSION_COOKIE)?.value || '';
  const session = await findDownloadSession({ database: prisma, sessionToken });
  if (!session) {
    const response = NextResponse.redirect(new URL('/indir?erisim=gerekli', request.url), 303);
    response.cookies.set(DOWNLOAD_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/indir',
      maxAge: 0
    });
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }
  const release = await getLatestRelease();
  if (!release) {
    return NextResponse.json(
      { tamam: false, hata: 'Kurulum dosyası şu anda hazırlanıyor.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' } }
    );
  }
  let downloadUrl;
  try { downloadUrl = githubReleaseAssetUrl(release); }
  catch {
    return NextResponse.json(
      { tamam: false, hata: 'Kurulum dosyası şu anda hazırlanıyor.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' } }
    );
  }
  let upstream;
  try {
    const range = request.headers.get('range');
    upstream = await fetch(downloadUrl, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        Accept: 'application/octet-stream',
        'User-Agent': 'Hermes-Secure-Download',
        ...(range ? { Range: range } : {})
      }
    });
  } catch (error) {
    console.error('[download] Kurulum kaynağına ulaşılamadı.', String(error?.message || error));
    upstream = null;
  }
  if (!upstream?.ok || !upstream.body) {
    upstream?.body?.cancel?.().catch?.(() => {});
    return NextResponse.json(
      { tamam: false, hata: 'Kurulum dosyası şu anda indirilemiyor.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' } }
    );
  }
  // Kaynak adresi tarayıcıya yönlendirilmez. Büyük kurulum dosyası tamponlanmadan
  // Hermes alan adı üzerinden akar; müşteri GitHub bağlantısını görmez.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: downloadHeaders(release, upstream)
  });
}
