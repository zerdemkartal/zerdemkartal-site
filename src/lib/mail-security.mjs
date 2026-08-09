const MB = 1024 * 1024;

export const MAIL_ATTACHMENT_MAX_BYTES = 3 * MB;
export const MAIL_ATTACHMENT_MAX_COUNT = 5;

const ALLOWED_ATTACHMENTS = new Map([
  ['application/pdf', ['.pdf']],
  ['image/png', ['.png']],
  ['image/jpeg', ['.jpg', '.jpeg']]
]);

const EXECUTABLE_EXTENSIONS = /\.(?:exe|msi|com|bat|cmd|scr|ps1|vbs|js|jar|apk|dmg|pkg)$/i;

function safeFilename(value) {
  return String(value || '')
    .replace(/[\\/\0\r\n]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function extensionOf(filename) {
  const match = String(filename).toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || '';
}

function validMagic(buffer, type) {
  if (type === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (type === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  return false;
}

export function prepareOutboundAttachments(input) {
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: true, attachments: [], metadata: [], totalBytes: 0 };
  }
  if (input.length > MAIL_ATTACHMENT_MAX_COUNT) {
    return { ok: false, error: `En fazla ${MAIL_ATTACHMENT_MAX_COUNT} dosya eklenebilir.` };
  }

  const attachments = [];
  const metadata = [];
  let totalBytes = 0;
  for (let index = 0; index < input.length; index += 1) {
    const raw = input[index] || {};
    const filename = safeFilename(raw.filename);
    const contentType = String(raw.contentType || '').toLowerCase().trim();
    const content = String(raw.content || '').replace(/\s+/g, '');
    const extension = extensionOf(filename);
    if (!filename || EXECUTABLE_EXTENSIONS.test(filename)) {
      return { ok: false, error: 'Çalıştırılabilir dosyalar e-posta eki olamaz; güvenli kurulum davetini kullanın.' };
    }
    const extensions = ALLOWED_ATTACHMENTS.get(contentType);
    if (!extensions || !extensions.includes(extension)) {
      return { ok: false, error: 'Yalnız PDF, PNG ve JPG dosyaları eklenebilir.' };
    }
    if (!content || !/^[A-Za-z0-9+/]+={0,2}$/.test(content)) {
      return { ok: false, error: `${filename} dosyasının içeriği geçersiz.` };
    }
    const buffer = Buffer.from(content, 'base64');
    if (!buffer.length || !validMagic(buffer, contentType)) {
      return { ok: false, error: `${filename} dosyasının türü ile içeriği uyuşmuyor.` };
    }
    totalBytes += buffer.length;
    if (totalBytes > MAIL_ATTACHMENT_MAX_BYTES) {
      return { ok: false, error: 'Eklerin toplam boyutu 3 MB sınırını aşıyor.' };
    }
    attachments.push({ filename, content, content_type: contentType });
    metadata.push({
      id: `outbound-${index + 1}-${Date.now().toString(36)}`,
      filename,
      content_type: contentType,
      size: buffer.length,
      outbound: true
    });
  }
  return { ok: true, attachments, metadata, totalBytes };
}

function headerValue(headers, name) {
  if (!headers || typeof headers !== 'object') return '';
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key] || '') : '';
}

function blockedPatterns(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 200);
}

export function assessMailSpam({
  fromAddress = '', subject = '', text = '', html = '', headers = {}, source = '', blocklist = ''
} = {}) {
  if (source === 'purchase-request') return { spam: false, score: 0, reasons: [] };

  const sender = String(fromAddress).trim().toLowerCase();
  const haystack = `${subject}\n${text}\n${String(html).replace(/<[^>]+>/g, ' ')}`.toLowerCase();
  const reasons = [];
  let score = 0;
  const blocked = blockedPatterns(blocklist);
  if (blocked.some((entry) => sender === entry || (entry.startsWith('@') && sender.endsWith(entry)))) {
    score += 10; reasons.push('engelli-gonderici');
  }
  if (!sender || !sender.includes('@')) {
    score += 4; reasons.push('gecersiz-gonderici');
  }

  const phrases = [
    /\b(?:casino|betting|bahis|kumar|forex|crypto investment|bitcoin profit)\b/i,
    /\b(?:guest post|backlink|link building|seo service|domain authority)\b/i,
    /\b(?:viagra|cialis|weight loss|adult dating)\b/i,
    /\b(?:urgent business proposal|inheritance fund|wire transfer)\b/i
  ];
  for (const pattern of phrases) {
    if (pattern.test(haystack)) { score += 3; reasons.push('istenmeyen-icerik'); }
  }

  const linkCount = (haystack.match(/https?:\/\//g) || []).length;
  if (linkCount >= 5) { score += 3; reasons.push('cok-fazla-baglanti'); }
  else if (linkCount >= 3) { score += 1; reasons.push('fazla-baglanti'); }

  const spamHeader = Number.parseFloat(headerValue(headers, 'x-spam-score'));
  if (Number.isFinite(spamHeader) && spamHeader >= 5) {
    score += 5; reasons.push('saglayici-spam-puani');
  }
  const auth = headerValue(headers, 'authentication-results').toLowerCase();
  if (/\b(?:spf|dkim|dmarc)=fail\b/.test(auth)) {
    score += 2; reasons.push('kimlik-dogrulama-basarisiz');
  }

  return { spam: score >= 4, score, reasons: [...new Set(reasons)] };
}
