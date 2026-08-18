// Kamusal blog sözleşmesi — çalışma kütüphanesindeki yüzlerce başlık kendiliğinden
// yayına açılmaz. Yalnız tarihli, içerikli ve published sayfalar ile bunların klasörleri görünür.
import { flattenTree } from '@/lib/blog';
import { PUBLIC_BLOG_TREE } from '@/content/blogArticles';

let _rows = null;
function rows() {
  if (!_rows) _rows = flattenTree(PUBLIC_BLOG_TREE);
  return _rows;
}

export function isPublishedBlogPage(row) {
  return row?.type === 'page'
    && row.status !== 'draft'
    && /^\d{4}-\d{2}-\d{2}$/.test(row.date || '')
    && Boolean(String(row.body || row.md || '').trim());
}

/** Kod içeriği + DB satırlarını birleştirir; DB'deki aynı kimlik kod içeriğini geçersiz kılar. */
export function publishedBlogRows(databaseRows = []) {
  const merged = new Map(rows().map((row) => [row.id, row]));
  for (const row of databaseRows || []) merged.set(row.id, row);

  const all = [...merged.values()];
  const byId = new Map(all.map((row) => [row.id, row]));
  const keptFolders = new Set();

  for (const page of all.filter(isPublishedBlogPage)) {
    let parentId = page.parentId;
    while (parentId && !keptFolders.has(parentId)) {
      keptFolders.add(parentId);
      parentId = byId.get(parentId)?.parentId || null;
    }
  }

  return all.filter((row) => isPublishedBlogPage(row) || (row.type === 'folder' && keptFolders.has(row.id)));
}

/** DB satırı varsa onun yayın durumuna uyar; yoksa kod içeriğine döner. */
export function publishedBlogById(id, databaseRow = null) {
  if (databaseRow) return isPublishedBlogPage(databaseRow) ? databaseRow : null;
  return rows().find((row) => row.id === id && isPublishedBlogPage(row)) || null;
}
