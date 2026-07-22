// Seed — iki kaynak, öncelik sırasıyla:
//   1. seed-data/export.json  → panel › Ayarlar › YEDEK › "Dışa aktar" çıktısı ({site, exportedAt, keys})
//   2. seed-data/library.json → kurulu blog kütüphanesi (yalnız zk_blog_tree yoksa)
// İçerik anahtarı hiç yoksa boş bırakılır: sayfalar Component.DEFAULT'larıyla çalışır,
// ilk PUT'ta DB'ye yazılır (prototipteki davranışın aynısı).
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const dir = path.dirname(fileURLToPath(import.meta.url));
const sd = (f) => path.join(dir, '..', 'seed-data', f);

const CONTENT_KEYS = {
  zk_anasayfa: 'anasayfa', zk_danismanlik: 'danismanlik', zk_programlar: 'programlar',
  zk_pd_astropen: 'pd_astropen', zk_pd_hermes: 'pd_hermes', zk_astroloji101: 'astroloji101',
  zk_harita: 'harita', zk_hakkimda: 'hakkimda'
};

function flattenTree(nodes, parentId = null, out = []) {
  nodes.forEach((n, i) => {
    const { children, seo, ...rest } = n;
    out.push({
      id: n.id, type: n.type, title: n.title || '', parentId, order: i,
      glyph: n.glyph ?? null, body: n.body ?? null, md: n.md ?? null,
      excerpt: n.excerpt ?? null, date: n.date ?? null,
      seoTitle: seo?.title ?? null, seoDesc: seo?.description ?? null,
      status: n.draft ? 'draft' : 'published', coverId: null
    });
    if (children?.length) flattenTree(children, n.id, out);
  });
  return out;
}

async function main() {
  let keys = {};
  if (existsSync(sd('export.json'))) {
    keys = JSON.parse(readFileSync(sd('export.json'), 'utf8')).keys || {};
    console.log('export.json bulundu:', Object.keys(keys).length, 'anahtar');
  }

  // 1) Sayfa içerikleri
  for (const [lsKey, dbKey] of Object.entries(CONTENT_KEYS)) {
    if (keys[lsKey] == null) continue;
    const data = typeof keys[lsKey] === 'string' ? JSON.parse(keys[lsKey]) : keys[lsKey];
    await prisma.pageContent.upsert({ where: { key: dbKey }, create: { key: dbKey, data }, update: { data } });
    console.log('içerik:', dbKey);
  }

  // 2) Blog ağacı (export'ta varsa onu, yoksa library.json)
  let tree = keys.zk_blog_tree ? (typeof keys.zk_blog_tree === 'string' ? JSON.parse(keys.zk_blog_tree) : keys.zk_blog_tree) : null;
  if (!tree && existsSync(sd('library.json'))) tree = JSON.parse(readFileSync(sd('library.json'), 'utf8'));
  const treeNodes = Array.isArray(tree) ? tree : tree?.nodes;
  if (treeNodes?.length) {
    const rows = flattenTree(treeNodes);
    for (const r of rows) await prisma.blogNode.upsert({ where: { id: r.id }, create: r, update: r });
    console.log('blog:', rows.length, 'düğüm');
  }

  // 3) Showcase + ayarlar
  if (keys.zk_blog_showcase) {
    const data = typeof keys.zk_blog_showcase === 'string' ? JSON.parse(keys.zk_blog_showcase) : keys.zk_blog_showcase;
    await prisma.blogShowcase.upsert({ where: { id: 1 }, create: { id: 1, data }, update: { data } });
  }
  if (keys.zk_admin_settings) {
    const data = typeof keys.zk_admin_settings === 'string' ? JSON.parse(keys.zk_admin_settings) : keys.zk_admin_settings;
    await prisma.setting.upsert({ where: { id: 1 }, create: { id: 1, data }, update: { data } });
  }

  // 4) Talepler + üyeler (prototip verisi taşınıyorsa)
  if (keys.zk_admin_talep) {
    const list = typeof keys.zk_admin_talep === 'string' ? JSON.parse(keys.zk_admin_talep) : keys.zk_admin_talep;
    for (const t of list) {
      await prisma.lead.upsert({
        where: { id: String(t.id) },
        create: { id: String(t.id), name: t.name || '', email: t.email ?? null, type: t.type || '', message: t.message ?? null, note: t.note ?? null, status: t.status === 'done' ? 'done' : t.status === 'seen' ? 'seen' : 'new' },
        update: {}
      });
    }
  }
  if (keys.zk_uye_hesaplar) {
    const list = typeof keys.zk_uye_hesaplar === 'string' ? JSON.parse(keys.zk_uye_hesaplar) : keys.zk_uye_hesaplar;
    for (const m of list) {
      await prisma.member.upsert({
        where: { email: m.email },
        create: {
          name: m.name || '', email: m.email,
          passHash: m.pass ? await bcrypt.hash(m.pass, 10) : null, // düz metin prototip şifresi → hash
          provider: m.provider ?? null, sub: m.sub ?? null, picture: m.picture ?? null, birth: m.birth ?? null
        },
        update: {}
      });
    }
  }

  if (keys.zk_bulten) {
    const list = typeof keys.zk_bulten === 'string' ? JSON.parse(keys.zk_bulten) : keys.zk_bulten;
    for (const b of list) {
      if (!b.email) continue;
      await prisma.newsletter.upsert({
        where: { email: String(b.email).toLowerCase() },
        create: { email: String(b.email).toLowerCase(), source: b.source ?? null },
        update: {}
      });
    }
  }

  // 5) İlk admin
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await prisma.adminUser.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      create: { email: process.env.ADMIN_EMAIL, passHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) },
      update: {}
    });
    console.log('admin:', process.env.ADMIN_EMAIL);
  }
}

main().finally(() => prisma.$disconnect());
