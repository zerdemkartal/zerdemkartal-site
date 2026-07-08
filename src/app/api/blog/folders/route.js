import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const FolderIn = z.object({
  id: z.string().optional(), // verilmezse f-<zaman> (prototip deseni)
  title: z.string().min(1).max(200),
  parentId: z.string().nullable().optional(),
  glyph: z.string().max(8).optional()
});

// POST /api/blog/folders — yeni klasör (kategori / alt kategori)
export async function POST(request) {
  const err = requireAdmin(request); if (err) return err;
  const body = await request.json().catch(() => null);
  const parsed = FolderIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçersiz gövde', detail: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const parentId = d.parentId ?? null;
  if (parentId) {
    const parent = await prisma.blogNode.findUnique({ where: { id: parentId } });
    if (!parent || parent.type !== 'folder') return Response.json({ error: 'parentId bir klasör değil' }, { status: 400 });
  }
  const last = await prisma.blogNode.findFirst({ where: { parentId }, orderBy: { order: 'desc' } });
  const row = await prisma.blogNode.create({
    data: {
      id: d.id || 'f-' + Date.now().toString(36), type: 'folder', title: d.title,
      parentId, glyph: d.glyph ?? null, order: (last?.order ?? -1) + 1
    }
  }).catch(() => null);
  if (!row) return Response.json({ error: 'kayıt başarısız (id çakışması?)' }, { status: 409 });
  return Response.json({ ok: true, id: row.id }, { status: 201 });
}
