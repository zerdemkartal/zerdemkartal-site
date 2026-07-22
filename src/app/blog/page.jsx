// BLOG — SSR portu (piksel referansı: Blog.dc.html; veri = BlogNode tablosu, boşsa library.json fallback).
// Kütüphane = sol kategori sidebar + "en sevilenler" akan şeridi + kart galerisi (BlogExplorer, istemci bileşeni).
import { prisma } from '@/lib/db';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer } from '@/components/Chrome';
import { buildTree } from '@/lib/blog';
import { libraryRows } from '@/lib/blogData';
import BlogExplorer from './BlogExplorer';

export const revalidate = 300;

const URL_ = SITE + '/blog';
const SEO = {
  title: 'Blog — Gökyüzü Günlüğü & Astroloji Kütüphanesi | Hermes',
  description: 'Transit notları, retro rehberleri ve burçlardan evlere uzanan astroloji kütüphanesi — sade bir Türkçeyle.'
};
export const metadata = pageMeta({ ...SEO, path: '/blog' });

const PALETTE = [
  { bg: '#F6E9E3', fg: '#C0562F' }, { bg: '#E9F0E4', fg: '#5C7A4A' }, { bg: '#E7EEF5', fg: '#3F6D96' },
  { bg: '#E4F0EE', fg: '#3E827A' }, { bg: 'var(--h-tint)', fg: 'var(--h-tint-ink)' }, { bg: '#F4ECD9', fg: '#9A7A2E' },
  { bg: '#F3E7EC', fg: '#9A4E68' }, { bg: '#E8EDE6', fg: '#5F7355' }
];
const strip = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const snip = (h) => { const s = strip(h); return s.length > 130 ? s.slice(0, 130).replace(/\s+\S*$/, '') + '…' : s; };
const firstPage = (node) => { for (const c of (node.children || [])) { if (c.type === 'page') return c; const f = firstPage(c); if (f) return f; } return null; };

function trimNodes(list, color, catTitle) {
  return (list || []).map((n) => n.type === 'folder'
    ? { id: n.id, type: 'folder', title: n.title, glyph: n.glyph || '✦', color, children: trimNodes(n.children, color, catTitle) }
    : { id: n.id, type: 'page', title: n.title, glyph: n.glyph || '✦', snippet: snip(n.body), color, catTitle });
}

export default async function Blog() {
  let rows = await prisma.blogNode.findMany({ where: { OR: [{ status: 'published' }, { type: 'folder' }] } }).catch(() => []);
  if (!rows.length) rows = libraryRows();
  const tree = buildTree(rows);

  const nodes = (tree.nodes || []).map((n, i) => {
    const color = PALETTE[i % PALETTE.length];
    return n.type === 'folder'
      ? { id: n.id, type: 'folder', title: n.title, glyph: n.glyph || '✦', color, children: trimNodes(n.children, color, n.title) }
      : { id: n.id, type: 'page', title: n.title, glyph: n.glyph || '✦', snippet: snip(n.body), color, catTitle: '' };
  });

  const featured = nodes.filter((n) => n.type === 'folder').map((n) => {
    const p = firstPage(n);
    return p ? { id: p.id, title: p.title, glyph: p.glyph, catTitle: n.title, color: p.color, snippet: p.snippet } : null;
  }).filter(Boolean).slice(0, 14);

  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'Blog', '@id': URL_ + '#blog', url: URL_, name: 'Hermes — Gökyüzü Günlüğü', description: SEO.description, inLanguage: 'tr-TR', publisher: { '@id': SITE + '/#org' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: URL_ }
    ] }
  ] };

  return (
    <main>
      <JsonLd data={jsonld} />
      <Nav active="/blog" />

      <div style={{ maxWidth: 1240, margin: '40px auto 0', padding: '0 16px' }}>
        <BlogExplorer nodes={nodes} featured={featured} />
      </div>

      <Footer />
    </main>
  );
}
