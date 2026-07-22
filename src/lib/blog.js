// Düz BlogNode satırları → prototipin {v:2, nodes:[...]} ağacı
export function buildTree(rows) {
  const byParent = new Map();
  for (const r of rows) {
    const list = byParent.get(r.parentId) || [];
    list.push(r); byParent.set(r.parentId, list);
  }
  const mk = (parentId) => (byParent.get(parentId) || [])
    .sort((a, b) => a.order - b.order)
    .map((r) => r.type === 'folder'
      ? { id: r.id, type: 'folder', title: r.title, glyph: r.glyph || undefined, open: false, children: mk(r.id) }
      : { id: r.id, type: 'page', title: r.title, glyph: r.glyph || undefined, body: r.body || '', md: r.md || undefined, excerpt: r.excerpt || '', date: r.date || '', draft: r.status === 'draft' || undefined, seo: { title: r.seoTitle || '', description: r.seoDesc || '' } });
  return { v: 2, nodes: mk(null) };
}

// Prototipin {v:2, nodes:[...]} ağacı → düz BlogNode satırları (PUT /api/blog/tree + seed ortak)
export function flattenTree(nodes, parentId = null, out = []) {
  (nodes || []).forEach((n, i) => {
    out.push({
      id: n.id, type: n.type, title: n.title || '', parentId, order: i,
      glyph: n.glyph ?? null, body: n.body ?? null, md: n.md ?? null,
      excerpt: n.excerpt ?? null, date: n.date ?? null,
      seoTitle: n.seo?.title ?? null, seoDesc: n.seo?.description ?? null,
      status: n.draft ? 'draft' : 'published', coverId: null
    });
    if (n.children?.length) flattenTree(n.children, n.id, out);
  });
  return out;
}
