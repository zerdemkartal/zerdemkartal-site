import { prisma } from '@/lib/db';
import { signMemberJwt } from '@/lib/auth';
import { pubMember } from '@/lib/member';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterIn = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  pass: z.string().min(6).max(200),
  birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() // doğum haritası kısayolu için, isteğe bağlı
});

// POST /api/uye/register — üye ol (prototipteki _signup'ın sunucu karşılığı)
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = RegisterIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçersiz gövde', detail: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const exists = await prisma.member.findUnique({ where: { email: d.email } });
  if (exists) return Response.json({ error: 'Bu e-posta ile zaten bir hesap var' }, { status: 409 });
  const row = await prisma.member.create({
    data: { name: d.name, email: d.email, passHash: await bcrypt.hash(d.pass, 10), birth: d.birth ?? null }
  });
  return Response.json({ token: signMemberJwt(row.email), member: pubMember(row) }, { status: 201 });
}
