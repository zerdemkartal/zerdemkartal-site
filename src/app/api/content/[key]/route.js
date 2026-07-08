import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { pingIndexNow } from '@/lib/indexnow';

// localStorage zk_<key> ↔ PageContent.key eşlemesi (whitelist)
const KEYS = new Set(['anasayfa', 'danismanlik', 'programlar', 'pd_astropen', 'pd_hermes', 'astroloji101', 'harita', 'hakkimda']);
// IndexNow: içerik anahtarı → etkilenen public URL
const KEY_PATH = { anasayfa: '/', danismanlik: '/danismanliklar', programlar: '/programlar', pd_astropen: '/programlar/astropen', pd_hermes: '/programlar/hermes', astroloji101: '/astroloji-101', harita: '/dogum-haritasi', hakkimda: '/hakkimda' };

// GET /api/content/:key — public okuma (SSR sayfaları + zk-data köprüsü)
export async function GET(_request, { params }) {
  if (!KEYS.has(params.key)) return Response.json({ error: 'bilinmeyen anahtar' }, { status: 404 });
  const row = await prisma.pageContent.findUnique({ where: { key: params.key } });
  return Response.json(row?.data ?? null); // null → sayfa Component.DEFAULT'unu kullanır
}

// PUT /api/content/:key — admin yazma (panel WYSIWYG / MCP)
export async function PUT(request, { params }) {
  const err = requireAdmin(request); if (err) return err;
  if (!KEYS.has(params.key)) return Response.json({ error: 'bilinmeyen anahtar' }, { status: 404 });
  const data = await request.json().catch(() => null);
  if (data == null || typeof data !== 'object') return Response.json({ error: 'JSON gövde gerekli' }, { status: 400 });
  await prisma.pageContent.upsert({ where: { key: params.key }, create: { key: params.key, data }, update: { data } });
  await pingIndexNow([KEY_PATH[params.key]].filter(Boolean));
  return Response.json({ ok: true });
}
