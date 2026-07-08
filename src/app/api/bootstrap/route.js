import { prisma } from '@/lib/db';
import { buildTree } from '@/lib/blog';

// GET /api/bootstrap — tüm public içerik tek istekte.
// public/zk-data.js adaptörü açılışta bunu belleğe alır; sayfalar senkron okumaya devam eder.
export async function GET() {
  const [contents, blogRows, showcase, settings, assets] = await Promise.all([
    prisma.pageContent.findMany(),
    prisma.blogNode.findMany({ where: { status: 'published' } }),
    prisma.blogShowcase.findUnique({ where: { id: 1 } }),
    prisma.setting.findUnique({ where: { id: 1 } }),
    prisma.asset.findMany({ select: { slotId: true, url: true } })
  ]);
  const keys = {};
  for (const c of contents) keys['zk_' + c.key] = c.data; // zk_anasayfa, zk_pd_astropen, ...
  keys.zk_blog_tree = buildTree(blogRows);
  if (showcase) keys.zk_blog_showcase = showcase.data;
  if (settings) keys.zk_admin_settings = settings.data;
  return Response.json({ keys, assets: Object.fromEntries(assets.map((a) => [a.slotId, a.url])) });
}
