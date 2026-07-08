import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/settings — public okuma (accent public sayfalarda da gerekir)
export async function GET() {
  const row = await prisma.setting.findUnique({ where: { id: 1 } });
  return Response.json(row?.data ?? null);
}

// PUT /api/settings — admin
export async function PUT(request) {
  const err = requireAdmin(request); if (err) return err;
  const data = await request.json().catch(() => null);
  if (data == null) return Response.json({ error: 'JSON gövde gerekli' }, { status: 400 });
  await prisma.setting.upsert({ where: { id: 1 }, create: { id: 1, data }, update: { data } });
  return Response.json({ ok: true });
}
