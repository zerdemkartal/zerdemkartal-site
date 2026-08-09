import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  DOWNLOAD_SESSION_COOKIE,
  DOWNLOAD_SESSION_MS,
  findDownloadSession,
  verifyDownloadInvite
} from '@/lib/download-invite.mjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Input = z.object({
  token: z.string().min(32).max(160),
  password: z.string().min(8).max(100)
}).strict();

function noStore(response) {
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export async function GET(request) {
  const sessionToken = request.cookies.get(DOWNLOAD_SESSION_COOKIE)?.value || '';
  const session = await findDownloadSession({ database: prisma, sessionToken });
  return noStore(NextResponse.json({
    tamam: Boolean(session),
    sonGecerlilik: session?.expiresAt || null
  }));
}

export async function POST(request) {
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return noStore(NextResponse.json({ error: 'gecersiz-istek' }, { status: 400 }));
  }
  const result = await verifyDownloadInvite({
    database: prisma,
    linkToken: parsed.data.token,
    password: parsed.data.password
  });
  if (!result.ok) {
    return noStore(NextResponse.json({ error: result.reason }, { status: result.status }));
  }

  const response = NextResponse.json({
    tamam: true,
    indirme: '/api/indir/windows',
    sonGecerlilik: result.expiresAt
  });
  response.cookies.set(DOWNLOAD_SESSION_COOKIE, result.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/indir',
    maxAge: Math.floor(DOWNLOAD_SESSION_MS / 1000)
  });
  return noStore(response);
}
