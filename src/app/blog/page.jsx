// BLOG — SSR portu (piksel referansı: Blog.dc.html; veri = BlogNode tablosu).
// Kütüphane ağacı (klasörler + yazılar) sunucuda basılır; hash router yerine temiz URL'ler.
import { prisma } from '@/lib/db';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, pStyle, sectionStyle } from '@/components/Chrome';
import { buildTree } from '@/lib/blog';

export const revalidate = 300;

const URL_ = SITE + '/blog';
const SEO = {
  title: 'Blog — Gökyüzü Günlüğü & Astroloji Kütüphanesi | zerdemkartal',
  description: 'Transit notları, retro rehberleri ve burçlardan evlere uzanan astroloji kütüphanesi — sade bir Türkçeyle.'
};

export const metadata = pageMeta({ ...SEO, path: '/blog' });

function Tree({ nodes, depth = 0 }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: depth ? '0 0 0 22px' : 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {nodes.map((n) => (
        <li key={n.id}>
          {n.type === 'folder' ? (
            <details open={depth === 0}>
              <summary style={{ fontFamily: T.serif, fontSize: depth ? 17 : 20, cursor: 'pointer', padding: '6px 0' }}>
                {n.glyph ? <span aria-hidden="true" style={{ marginRight: 8 }}>{n.glyph}</span> : null}{n.title}
              </summary>
              <Tree nodes={n.children || []} depth={depth + 1} />
            </details>
          ) : (
            <a href={`/blog/yazi/${n.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '7px 0', color: T.ink, textDecoration: 'none', fontSize: 15.5 }}>
              <span>{n.title}</span>
              {n.date && <span style={{ color: T.muted, fontSize: 13, whiteSpace: 'nowrap' }}>{n.date}</span>}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function Blog() {
  const rows = await prisma.blogNode.findMany({ where: { OR: [{ status: 'published' }, { type: 'folder' }] } }).catch(() => []);
  const tree = buildTree(rows);
  const latest = rows.filter((r) => r.type === 'page').sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);

  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'Blog', '@id': URL_ + '#blog', url: URL_, name: 'zerdemkartal — Gökyüzü Günlüğü', description: SEO.description, inLanguage: 'tr-TR', publisher: { '@id': SITE + '/#org' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: URL_ }
    ] }
  ] };

  return (
    <main>
      <JsonLd data={jsonld} />
      <Nav active="/blog" />

      <section style={{ ...sectionStyle, paddingTop: 64 }}>
        <div style={kickerStyle}>GÖKYÜZÜ GÜNLÜĞÜ</div>
        <h1 style={h1Style}>Okumak da <span style={{ color: T.muted }}>bir yolculuk</span></h1>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontFamily: T.serif, fontWeight: 470, fontSize: 26, margin: 0 }}>Son yazılar</h2>
        <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}` }}>
          {latest.map((p) => (
            <a key={p.id} href={`/blog/yazi/${p.id}`} style={{ display: 'block', padding: '18px 4px', borderBottom: `1px solid ${T.border}`, color: T.ink, textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                <span style={{ fontFamily: T.serif, fontSize: 21 }}>{p.title}</span>
                <span style={{ color: T.muted, fontSize: 14, whiteSpace: 'nowrap' }}>{p.date}</span>
              </div>
              {p.excerpt && <p style={{ ...pStyle, fontSize: 14.5, marginTop: 6, maxWidth: 720 }}>{p.excerpt}</p>}
            </a>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontFamily: T.serif, fontWeight: 470, fontSize: 26, margin: 0 }}>Kütüphane</h2>
        <div style={{ marginTop: 18, background: '#FFFFFF', border: `1px solid ${T.border}`, borderRadius: 20, padding: '26px 30px' }}>
          <Tree nodes={tree.nodes || []} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
