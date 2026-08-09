import { NextResponse } from 'next/server';
import { getLatestRelease, githubReleaseAssetUrl } from '@/lib/releases';
import { prisma } from '@/lib/db';
import { DOWNLOAD_SESSION_COOKIE, findDownloadSession } from '@/lib/download-invite.mjs';

export const dynamic = 'force-dynamic';

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
  const response = NextResponse.redirect(downloadUrl, 303);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}
