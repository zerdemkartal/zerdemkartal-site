import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { pingIndexNow } from '@/lib/indexnow';
import { HERMES_SITE } from '@/lib/defaults';

// PageContent anahtar whitelist'i — H1 dönüşümü: site içeriği tek 'hermes_site' anahtarında.
// Eski anahtarlar okunabilir kalır (arşiv/prototip verisi), ama site onları artık kullanmıyor.
const KEYS = new Set(['hermes_site', 'anasayfa', 'danismanlik', 'programlar', 'pd_astropen', 'pd_hermes', 'astroloji101', 'harita', 'hakkimda']);
// IndexNow: içerik anahtarı → etkilenen public URL'ler
const KEY_PATHS = { hermes_site: ['/', '/ozellikler', '/fiyat', '/indir', '/sss'] };

// GET /api/content/:key — public okuma (SSR sayfaları + MCP + zk-data köprüsü).
// hermes_site: DB satırı yoksa VARSAYILAN model döner → MCP ilk günden oku-birleştir-yaz yapabilir.
export async function GET(_request, { params }) {
  if (!KEYS.has(params.key)) return Response.json({ error: 'bilinmeyen anahtar' }, { status: 404 });
  const row = await prisma.pageContent.findUnique({ where: { key: params.key } });
  if (params.key === 'hermes_site') return Response.json(row?.data ?? HERMES_SITE);
  return Response.json(row?.data ?? null); // null → sayfa varsayılanını kullanır
}

// PUT /api/content/:key — admin yazma (MCP / panel)
export async function PUT(request, { params }) {
  const err = requireAdmin(request); if (err) return err;
  if (!KEYS.has(params.key)) return Response.json({ error: 'bilinmeyen anahtar' }, { status: 404 });
  const data = await request.json().catch(() => null);
  if (data == null || typeof data !== 'object') return Response.json({ error: 'JSON gövde gerekli' }, { status: 400 });
  await prisma.pageContent.upsert({ where: { key: params.key }, create: { key: params.key, data }, update: { data } });
  await pingIndexNow(KEY_PATHS[params.key] || []);
  return Response.json({ ok: true });
}
