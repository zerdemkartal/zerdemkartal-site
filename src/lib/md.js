// Markdown → HTML (BlogYonetim._md / Yonetim._mdToHtml'in sunucu portu — birebir aynı çıktı,
// böylece MCP/panel hangi yoldan yazarsa yazsın reader aynı HTML'i görür)
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inline(s) {
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

export function mdToHtml(md) {
  md = (md || '').replace(/^\uFEFF/, '');
  const lines = md.split(/\r?\n/); let html = ''; let para = [];
  const flush = () => { if (para.length) { html += '<p>' + inline(para.join(' ')) + '</p>'; para = []; } };
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { flush(); i++; continue; }
    if (t === '---') { flush(); html += '<hr>'; i++; continue; }
    let m;
    if ((m = t.match(/^(#{1,3})\s+(.*)$/))) { flush(); const l = m[1].length; const tag = l === 1 ? 2 : l; html += '<h' + tag + '>' + inline(m[2]) + '</h' + tag + '>'; i++; continue; }
    if (t.charAt(0) === '>') { flush(); const q = []; while (i < lines.length && lines[i].trim().charAt(0) === '>') { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; } html += '<blockquote>' + inline(q.join(' ')) + '</blockquote>'; continue; }
    if (/^[-*]\s+/.test(t)) { flush(); const it = []; while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { it.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++; } html += '<ul>' + it.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>'; continue; }
    if (/^\d+\.\s+/.test(t)) { flush(); const it = []; while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { it.push(lines[i].trim().replace(/^\d+\.\s+/, '')); i++; } html += '<ol>' + it.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ol>'; continue; }
    para.push(t); i++;
  }
  flush(); return html;
}

// HTML → düz metin (kelime sayımı / md'siz eski yazılar için)
export function htmlToText(html) {
  let s = String(html || '');
  s = s.replace(/<\/(h[1-3]|p|li|blockquote|div)>/gi, '\n');
  s = s.replace(/<(br|hr)[^>]*>/gi, '\n');
  s = s.replace(/<[^>]*>/g, '');
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  return s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
