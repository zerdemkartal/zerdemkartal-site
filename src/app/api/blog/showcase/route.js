import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/blog/showcase — blog kamusal erişime kapalıyken yalnız admin okuyabilir.
export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return Response.json({ error: 'blog yayında değil' }, { status: 404 });
  const row = await prisma.blogShowcase.findUnique({ where: { id: 1 } });
  return Response.json(row?.data ?? null);
}

// PUT /api/blog/showcase — admin ({ mode, ids, interval })
export async function PUT(request) {
  const err = requireAdmin(request); if (err) return err;
  const data = await request.json().catch(() => null);
  if (data == null || typeof data !== 'object') return Response.json({ error: 'JSON gövde gerekli' }, { status: 400 });
  await prisma.blogShowcase.upsert({ where: { id: 1 }, create: { id: 1, data }, update: { data } });
  return Response.json({ ok: true });
}
