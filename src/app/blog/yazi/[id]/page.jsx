// BLOG YAZISI — /blog/yazi/[id] (Blog.dc.html #/yazi rotasının SSR karşılığı).
// Gövde: page.body (WYSIWYG HTML) varsa o, yoksa md → HTML (lib/md). JSON-LD: BlogPosting (page.seo'dan).
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, h1Style, sectionStyle } from '@/components/Chrome';
import { mdToHtml } from '@/lib/md';
import { libraryById } from '@/lib/blogData';

export const revalidate = 300;

async function load(id) {
  const row = await prisma.blogNode.findUnique({ where: { id } }).catch(() => null);
  if (row) return row.type === 'page' && row.status !== 'draft' ? row : null;
  return libraryById(id); // DB'de yoksa kütüphaneden (fallback)
}

export async function generateMetadata({ params }) {
  const p = await load(params.id);
  if (!p) return { title: 'Yazı bulunamadı' };
  return pageMeta({
    title: p.seoTitle || `${p.title} | Hermes`,
    description: p.seoDesc || p.excerpt || '',
    path: `/blog/yazi/${p.id}`,
    ogType: 'article'
  });
}

const ARTICLE_CSS = `
  .zk-yazi { font-size: 17px; line-height: 1.8; color: var(--h-ink2); }
  .zk-yazi h1, .zk-yazi h2, .zk-yazi h3 { font-family: 'Newsreader', serif; font-weight: 500; color: var(--h-ink); line-height: 1.2; margin: 1.6em 0 0.4em; }
  .zk-yazi h2 { font-size: 28px; } .zk-yazi h3 { font-size: 22px; }
  .zk-yazi blockquote { margin: 1.4em 0; padding: 4px 0 4px 20px; border-left: 3px solid var(--h-accent); font-family: 'Newsreader', serif; font-style: italic; font-size: 19px; }
  .zk-yazi hr { border: none; border-top: 1px solid var(--h-border); margin: 2em 0; }
  .zk-yazi ul, .zk-yazi ol { padding-left: 24px; }
  .zk-yazi img { max-width: 100%; border-radius: 14px; }
  .zk-yazi .callout { display: flex; gap: 14px; align-items: flex-start; background: var(--h-cream); border: 1px solid var(--h-border); border-left: 4px solid var(--cl, var(--h-accent)); border-radius: 14px; padding: 16px 18px; margin: 1.5em 0; }
  .zk-yazi .callout-ico { font-size: 22px; line-height: 1.5; color: var(--cl, var(--h-accent)); flex: none; }
  .zk-yazi .callout-body { flex: 1; min-width: 0; }
`;

export default async function Yazi({ params }) {
  const p = await load(params.id);
  if (!p) notFound();
  const url = `${SITE}/blog/yazi/${p.id}`;
  const html = p.body || (p.md ? mdToHtml(p.md) : '');

  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'BlogPosting', '@id': url + '#yazi', headline: p.seoTitle || p.title, description: p.seoDesc || p.excerpt || '', url, mainEntityOfPage: url, datePublished: p.date || undefined, dateModified: p.updatedAt, inLanguage: 'tr-TR', author: { '@type': 'Person', '@id': SITE + '/#astrolog', name: 'zerdemkartal' }, publisher: { '@id': SITE + '/#org' }, isPartOf: { '@id': SITE + '/blog#blog' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url }
    ] }
  ] };

  return (
    <main>
      <JsonLd data={jsonld} />
      <style dangerouslySetInnerHTML={{ __html: ARTICLE_CSS }} />
      <Nav active="/blog" />

      <article style={{ ...sectionStyle, paddingTop: 64, maxWidth: 820 }}>
        <nav aria-label="Kısayollar" style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 13.5, color: T.muted }}>
          <a href="/" style={{ color: T.muted, textDecoration: 'none' }}>← Ana sayfa</a>
          <span aria-hidden="true">·</span>
          <a href="/blog" style={{ color: T.muted, textDecoration: 'none' }}>Kütüphane</a>
        </nav>
        <div style={{ ...kickerStyle, marginTop: 26 }}>{p.date}</div>
        <h1 style={{ ...h1Style, fontSize: 'clamp(32px, 4.4vw, 48px)' }}>{p.title}</h1>
        {p.excerpt && <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, lineHeight: 1.6, color: T.ink2, marginTop: 18 }}>{p.excerpt}</p>}
        <div className="zk-yazi" style={{ marginTop: 30 }} dangerouslySetInnerHTML={{ __html: html }} />

        <div style={{ marginTop: 46, paddingTop: 26, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/blog" style={{ background: T.dark, color: 'var(--h-dark-text)', borderRadius: 999, padding: '12px 24px', textDecoration: 'none', fontWeight: 600, fontSize: 14.5 }}>← Kütüphaneye dön</a>
          <a href="/" style={{ border: `1px solid ${T.border}`, color: T.ink, borderRadius: 999, padding: '12px 24px', textDecoration: 'none', fontSize: 14.5 }}>Ana sayfa</a>
        </div>
      </article>

      <Footer />
    </main>
  );
}
