import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { mdToHtml } from '@/lib/md';
import { pingIndexNow } from '@/lib/indexnow';

// GET /api/blog/pages/:id — tek yazı (taslaksa yalnız admin görür)
export async function GET(request, { params }) {
  const row = await prisma.blogNode.findUnique({ where: { id: params.id } });
  if (!row || row.type !== 'page') return Response.json({ error: 'yazı bulunamadı' }, { status: 404 });
  if (row.status === 'draft' && requireAdmin(request)) return Response.json({ error: 'yazı bulunamadı' }, { status: 404 });
  return Response.json(pub(row));
}

const PageIn = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().max(500_000).optional(),   // WYSIWYG HTML
  md: z.string().max(500_000).optional(),     // Markdown kaynağı
  excerpt: z.string().max(1000).optional(),
  date: z.string().max(20).optional(),
  seo: z.object({ title: z.string().max(120).optional(), description: z.string().max(300).optional() }).optional(),
  draft: z.boolean().optional(),
  parentId: z.string().nullable().optional(), // klasöre taşıma
  order: z.number().int().optional()
});

// POST /api/blog/pages/:id — yeni yazı oluştur (id istemciden: p-<zaman> prototip deseni)
export async function POST(request, { params }) {
  const err = requireAdmin(request); if (err) return err;
  const d = await parse(request); if (d instanceof Response) return d;
  const exists = await prisma.blogNode.findUnique({ where: { id: params.id } });
  if (exists) return Response.json({ error: 'id zaten var — güncellemek için PUT' }, { status: 409 });
  if (d.parentId && !(await prisma.blogNode.findUnique({ where: { id: d.parentId } })))
    return Response.json({ error: 'parentId bulunamadı' }, { status: 400 });
  const row = await prisma.blogNode.create({ data: { id: params.id, type: 'page', ...toRow(d), title: d.title || 'Yeni yazı' } });
  await pingIndexNow(['/blog/yazi/' + row.id, '/blog']);
  return Response.json(pub(row), { status: 201 });
}

// PUT /api/blog/pages/:id — mevcut yazıyı güncelle (yalnız gönderilen alanlar)
export async function PUT(request, { params }) {
  const err = requireAdmin(request); if (err) return err;
  const d = await parse(request); if (d instanceof Response) return d;
  const row = await prisma.blogNode.update({ where: { id: params.id }, data: toRow(d) }).catch(() => null);
  if (!row) return Response.json({ error: 'yazı bulunamadı' }, { status: 404 });
  await pingIndexNow(['/blog/yazi/' + row.id]);
  return Response.json(pub(row));
}

// PATCH — kısmi güncelleme (MCP yazi_seo / yazi_yayin_durumu bu ucu kullanır); PUT ile aynı gövde
export const PATCH = PUT;

async function parse(request) {
  const body = await request.json().catch(() => null);
  const parsed = PageIn.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'geçersiz gövde', detail: parsed.error.flatten() }, { status: 400 });
  return parsed.data;
}

function toRow(d) {
  const r = {};
  if (d.title !== undefined) r.title = d.title;
  if (d.body !== undefined) r.body = d.body;
  if (d.md !== undefined) {
    r.md = d.md;
    if (d.body === undefined) r.body = mdToHtml(d.md); // MCP/panel Markdown yazar → sunucu HTML'e çevirir
  }
  if (d.excerpt !== undefined) r.excerpt = d.excerpt;
  if (d.date !== undefined) r.date = d.date;
  if (d.seo?.title !== undefined) r.seoTitle = d.seo.title;
  if (d.seo?.description !== undefined) r.seoDesc = d.seo.description;
  if (d.draft !== undefined) r.status = d.draft ? 'draft' : 'published';
  if (d.parentId !== undefined) r.parentId = d.parentId;
  if (d.order !== undefined) r.order = d.order;
  return r;
}

function pub(r) {
  return {
    id: r.id, title: r.title, body: r.body || '', md: r.md || undefined,
    excerpt: r.excerpt || '', date: r.date || '', draft: r.status === 'draft' || undefined,
    parentId: r.parentId, order: r.order,
    seo: { title: r.seoTitle || '', description: r.seoDesc || '' }
  };
}
