// Blog fallback — DB'de blog yoksa kütüphane seed-data/library.json'dan basılır.
// (Diğer sayfaların code-default deseninin blog karşılığı; DB dolunca DB kazanır.)
// library.json düz bir düğüm dizisidir ([...]); {v:2, nodes:[...]} biçimi de desteklenir.
import { flattenTree } from '@/lib/blog';
import libraryTree from '../../seed-data/library.json';

let _rows = null;
function rows() {
  if (!_rows) {
    const nodes = Array.isArray(libraryTree) ? libraryTree : (libraryTree?.nodes || []);
    _rows = flattenTree(nodes);
  }
  return _rows;
}

/** Kütüphanenin tüm düğümleri (klasör + yazı) düz satırlar hâlinde. */
export function libraryRows() {
  return rows();
}

/** Tek bir yazıyı id ile getir (yalnız yayınlanmış sayfa). */
export function libraryById(id) {
  return rows().find((r) => r.id === id && r.type === 'page') || null;
}
