import { prisma } from '@/lib/db';
import { signMemberJwt } from '@/lib/auth';
import { pubMember } from '@/lib/member';
import { z } from 'zod';

const In = z.object({ credential: z.string().min(20) }); // GIS id_token (JWT)

// POST /api/uye/google — Google girişi. id_token SUNUCUDA doğrulanır
// (prototipte istemci decode ediyordu — üretimde asla). Bağımlılık eklememek için
// Google'ın tokeninfo ucu kullanılıyor; yoğun trafikte google-auth-library ile
// yerel imza doğrulamasına geçirilebilir.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = In.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'credential gerekli' }, { status: 400 });
  if (!process.env.GOOGLE_CLIENT_ID) return Response.json({ error: 'Google girişi yapılandırılmamış' }, { status: 501 });

  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(parsed.data.credential));
  if (!r.ok) return Response.json({ error: 'token doğrulanamadı' }, { status: 401 });
  const p = await r.json();
  if (p.aud !== process.env.GOOGLE_CLIENT_ID || p.email_verified !== 'true')
    return Response.json({ error: 'token doğrulanamadı' }, { status: 401 });

  // zk-google-auth.js upsert'inin sunucu karşılığı
  const row = await prisma.member.upsert({
    where: { email: p.email },
    create: { name: p.name || p.email, email: p.email, provider: 'google', sub: p.sub, picture: p.picture ?? null },
    update: { provider: 'google', sub: p.sub, picture: p.picture ?? null }
  });
  return Response.json({ token: signMemberJwt(row.email), member: pubMember(row) });
}
