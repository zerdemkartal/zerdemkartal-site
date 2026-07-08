import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const In = z.object({
  email: z.string().email().max(200),
  source: z.string().max(40).optional()
});

// POST /api/newsletter — public bülten kaydı (İletişim sayfası kutusu). Tekrar kayıt sessizce ok döner.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = In.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçerli bir e-posta gerekli' }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  await prisma.newsletter.upsert({
    where: { email },
    create: { email, source: parsed.data.source ?? null },
    update: {}
  });
  return Response.json({ ok: true }, { status: 201 });
}

// GET /api/newsletter — admin abone listesi (yeniden eskiye)
export async function GET(request) {
  const err = requireAdmin(request); if (err) return err;
  const rows = await prisma.newsletter.findMany({ orderBy: { createdAt: 'desc' } });
  return Response.json(rows);
}
