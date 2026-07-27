import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { buildTree, flattenTree } from '@/lib/blog';
import { pingIndexNow } from '@/lib/indexnow';

// GET /api/blog/tree — blog kamusal erişime kapalıyken yalnız admin okuyabilir.
export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return Response.json({ error: 'yazılar yayında değil' }, { status: 404 });
  const rows = await prisma.blogNode.findMany();
  return Response.json(buildTree(rows));
}

// PUT /api/blog/tree — admin: ağacın tamamını değiştirir (BlogYonetim kaydetme yolu).
// Prototip {v:2, nodes:[...]} formatı; transaction içinde sil + yeniden yaz.
export async function PUT(request) {
  const err = requireAdmin(request); if (err) return err;
  const tree = await request.json().catch(() => null);
  if (!tree || !Array.isArray(tree.nodes)) return Response.json({ error: '{v:2, nodes:[...]} bekleniyor' }, { status: 400 });
  const rows = flattenTree(tree.nodes);
  const ids = new Set(rows.map((r) => r.id));
  if (ids.size !== rows.length) return Response.json({ error: 'tekrarlanan düğüm id\u0027si' }, { status: 400 });
  await prisma.$transaction([
    prisma.blogNode.deleteMany({}),
    prisma.blogNode.createMany({ data: rows })
  ]);
  await pingIndexNow(['/blog']);
  return Response.json({ ok: true, count: rows.length });
}
