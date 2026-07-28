import { prisma } from '@/lib/db';
import { signAdminJwt, signMailOperatorJwt } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const LoginIn = z.object({ email: z.string().email(), pass: z.string().min(1).max(200) });

// POST /api/auth/login — yönetim veya yalnız posta girişi → 12 saatlik rol JWT'si
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = LoginIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçersiz gövde' }, { status: 400 });
  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  const ok = user && (await bcrypt.compare(parsed.data.pass, user.passHash));
  if (!ok) return Response.json({ error: 'e-posta veya şifre hatalı' }, { status: 401 });
  if (user.role === 'admin') {
    return Response.json({ token: signAdminJwt(user.email), email: user.email, role: user.role });
  }
  if (user.role === 'mail_operator') {
    return Response.json({ token: signMailOperatorJwt(user.email), email: user.email, role: user.role });
  }
  return Response.json({ error: 'bu hesap için yönetim yetkisi tanımlı değil' }, { status: 403 });
}
