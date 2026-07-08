import { prisma } from '@/lib/db';
import { signMemberJwt } from '@/lib/auth';
import { pubMember } from '@/lib/member';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const LoginIn = z.object({ email: z.string().email(), pass: z.string().min(1).max(200) });

// POST /api/uye/login — üye girişi
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = LoginIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçersiz gövde' }, { status: 400 });
  const row = await prisma.member.findUnique({ where: { email: parsed.data.email } });
  if (row && !row.passHash)
    return Response.json({ error: 'Bu hesap Google ile kayıtlı — Google ile giriş yapın' }, { status: 409 }); // prototip _signin guard'ı
  const ok = row && (await bcrypt.compare(parsed.data.pass, row.passHash));
  if (!ok) return Response.json({ error: 'e-posta veya şifre hatalı' }, { status: 401 });
  return Response.json({ token: signMemberJwt(row.email), member: pubMember(row) });
}
