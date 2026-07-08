import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { buildTree, flattenTree } from '@/lib/blog';
import { pingIndexNow } from '@/lib/indexnow';

// GET /api/blog/tree — public: yayında olanlar; admin token'la ?drafts=1 → taslaklar dahil
export async function GET(request) {
  const wantDrafts = new URL(request.url).searchParams.get('drafts') === '1';
  const isAdmin = wantDrafts && !requireAdmin(request); // requireAdmin null dönerse yetkili
  const rows = await prisma.blogNode.findMany(isAdmin ? {} : { where: { OR: [{ status: 'published' }, { type: 'folder' }] } });
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
