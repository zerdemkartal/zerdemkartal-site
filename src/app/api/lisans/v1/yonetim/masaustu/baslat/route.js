import { prisma } from '@/lib/db';
import { createDesktopPairingValues } from '@/lib/license/desktop-pairing.mjs';
import crypto from 'node:crypto';

export async function POST(request) {
  if (process.env.LICENSE_V1_ENABLED !== '1') {
    return Response.json({ error: 'lisans-servisi-hazirlikta' }, { status: 503 });
  }
  if (request.headers.get('x-hermes-desktop-client') !== 'kripto-yonetimi/1') {
    return Response.json({ error: 'gecersiz-masaustu-istemcisi' }, { status: 403 });
  }
  const now = new Date();
  const value = createDesktopPairingValues(now);
  const userAgent = request.headers.get('user-agent') || '';
  const forwarded = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const ipHash = crypto.createHmac('sha256', process.env.JWT_SECRET || 'missing-secret')
    .update(forwarded || 'unknown', 'utf8').digest('hex');
  await prisma.$transaction(async (tx) => {
    await tx.desktopPairing.deleteMany({ where: { expiresAt: { lte: now } } });
    const recent = await tx.desktopPairing.count({
      where: {
        createdAt: { gte: new Date(now.getTime() - 60_000) },
        context: { path: ['ipHash'], equals: ipHash }
      }
    });
    if (recent >= 6) throw new Error('pairing-rate-limit');
    await tx.desktopPairing.create({
      data: {
        id: value.id,
        secretHash: value.secretHash,
        expiresAt: value.expiresAt,
        context: { istemci: 'kripto-yonetimi', userAgent: userAgent.slice(0, 240), ipHash }
      }
    });
  }).catch((error) => {
    if (error?.message === 'pairing-rate-limit') return null;
    throw error;
  });
  const exists = await prisma.desktopPairing.findUnique({ where: { id: value.id }, select: { id: true } });
  if (!exists) return Response.json({ error: 'cok-fazla-deneme' }, {
    status: 429,
    headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' }
  });
  const site = String(process.env.SITE_URL || 'https://www.hermesastroloji.com').replace(/\/$/, '');
  return Response.json({
    tamam: true,
    eslestirmeId: value.id,
    eslestirmeSirri: value.secret,
    sonGecerlilik: value.expiresAt,
    girisAdresi: `${site}/yonetim/lisans?masaustu=${encodeURIComponent(value.id)}#s=${encodeURIComponent(value.secret)}`
  }, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
