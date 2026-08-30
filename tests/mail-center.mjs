import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MAIL_ATTACHMENT_MAX_BYTES,
  assessMailSpam,
  prepareOutboundAttachments
} from '../src/lib/mail-security.mjs';
import { invoiceValidationIssue, normalizeInvoiceData } from '../src/lib/purchase-invoice.mjs';
import { salesNotificationRecipients } from '../src/lib/email.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0;

function test(name, fn) {
  try { fn(); passed += 1; console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}

test('PDF fatura eki doğrulanıyor ve yalnız metadata saklanıyor', () => {
  const content = Buffer.from('%PDF-1.4\nHermes invoice', 'utf8').toString('base64');
  const result = prepareOutboundAttachments([{
    filename: 'Fatura 2026-001.pdf', contentType: 'application/pdf', content
  }]);
  assert.equal(result.ok, true);
  assert.equal(result.attachments[0].content, content);
  assert.equal(result.metadata[0].filename, 'Fatura 2026-001.pdf');
  assert.equal('content' in result.metadata[0], false);
});

test('Çalıştırılabilir ek reddedilip güvenli davete yönlendiriliyor', () => {
  const result = prepareOutboundAttachments([{
    filename: 'Hermes.exe', contentType: 'application/octet-stream', content: 'TVqQAA=='
  }]);
  assert.equal(result.ok, false);
  assert.match(result.error, /güvenli kurulum davetini/i);
});

test('Dosya uzantısı ve magic byte uyuşmazlığı reddediliyor', () => {
  const result = prepareOutboundAttachments([{
    filename: 'fatura.pdf', contentType: 'application/pdf',
    content: Buffer.from('not a pdf', 'utf8').toString('base64')
  }]);
  assert.equal(result.ok, false);
  assert.match(result.error, /uyuşmuyor/i);
});

test('Ek toplam boyut sınırı uygulanıyor', () => {
  const largePdf = Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(MAIL_ATTACHMENT_MAX_BYTES + 1)]).toString('base64');
  const result = prepareOutboundAttachments([{
    filename: 'buyuk.pdf', contentType: 'application/pdf', content: largePdf
  }]);
  assert.equal(result.ok, false);
  assert.match(result.error, /3 MB/i);
});

test('Bariz istenmeyen içerik Spam olarak sınıflanıyor', () => {
  const result = assessMailSpam({
    fromAddress: 'sales@example.net', subject: 'Guest post and backlink',
    text: 'SEO service and link building offer https://a.test https://b.test https://c.test'
  });
  assert.equal(result.spam, true);
  assert.ok(result.score >= 4);
});

test('Elle engellenen alan adı doğrudan Spam oluyor', () => {
  const result = assessMailSpam({
    fromAddress: 'offer@spam.example', subject: 'Hello', text: 'Message', blocklist: '@spam.example'
  });
  assert.equal(result.spam, true);
  assert.ok(result.reasons.includes('engelli-gonderici'));
});

test('Satın alma talebi spam kelimelerinden etkilenmiyor', () => {
  const result = assessMailSpam({
    fromAddress: 'customer@example.com', subject: 'Satın alma', text: 'bitcoin casino', source: 'purchase-request'
  });
  assert.equal(result.spam, false);
  assert.equal(result.score, 0);
});

test('Fatura bilgileri ödeme öncesinde normalize edilip eksik alanlar reddediliyor', () => {
  const invoice = normalizeInvoiceData({
    invoiceType: 'corporate', phone: '0555 111 22 33', companyTitle: 'Hermes Test Ltd.',
    taxNumber: '1234567890', taxOffice: 'Merkez', billingAddress: 'Örnek Mahallesi 10/2',
    billingDistrict: 'Mezitli', billingCity: 'Mersin'
  });
  assert.equal(invoice.phone, '+905551112233');
  assert.equal(invoice.taxNumber, '1234567890');
  assert.equal(invoiceValidationIssue(invoice), null);
  assert.equal(invoiceValidationIssue({ ...invoice, billingAddress: '' }).field, 'billingAddress');
});

test('Satış bildirimi alıcıları satış, posta kutusu ve yönetici adreslerini tekilleştiriyor', () => {
  const recipients = salesNotificationRecipients({
    SALES_NOTIFICATION_EMAILS: 'sales@example.com,OWNER@example.com',
    MAILBOX_ADDRESSES: 'info@example.com,sales@example.com',
    ADMIN_EMAIL: 'owner@example.com'
  });
  assert.deepEqual(recipients, ['sales@example.com', 'owner@example.com', 'info@example.com']);
});

test('Posta UI çöp, toplu işlem, şablon, fatura eki ve güvenli kurulumu birlikte sunuyor', () => {
  const client = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/posta/PostaClient.jsx'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/posta/posta.module.css'), 'utf8');
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/mail/[id]/route.js'), 'utf8');
  const bulkRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/mail/bulk/route.js'), 'utf8');
  const leads = fs.readFileSync(path.join(ROOT, 'src/app/api/leads/route.js'), 'utf8');
  assert.ok(client.includes("['trash', 'Çöp'"));
  assert.ok(client.includes('İndirme linki oluştur'));
  assert.ok(client.includes('className={styles.indirmeKisa}'));
  assert.ok(client.includes("mod: 'olustur'"));
  assert.ok(client.includes('authToken: licenseToken'));
  assert.ok(client.includes("sessionStorage.getItem(LICENSE_TOKEN_KEY)"));
  assert.ok(client.includes('önce Lisans Yönetimi’nde sahip oturumunu açıp yeniden doğrulayın'));
  assert.ok(client.includes('6 saatlik bağlantıyı oluştur'));
  assert.ok(client.includes('Bağlantıyı kopyala'));
  assert.ok(client.includes('Mesaja ekle'));
  assert.ok(css.includes('.modalArka'));
  assert.ok(css.includes('.linkSonuc'));
  assert.ok(client.includes('Fatura veya belge ekle'));
  assert.ok(client.includes('Hazır mesaj'));
  assert.ok(!client.includes("import { Nav }"));
  assert.ok(!client.includes('<header className={styles.ust}>'));
  assert.ok(client.includes("document.body.classList.add('h-posta-app')"));
  assert.match(css, /\.kabuk\{[^}]*box-sizing:border-box[^}]*height:100dvh[^}]*min-height:0/);
  assert.match(css, /\.liste\{[^}]*min-height:0[^}]*overflow:hidden[^}]*grid-template-rows:auto auto minmax\(0,1fr\)/);
  assert.match(css, /\.threadler\{[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.match(css, /\.detay\{[^}]*min-height:0[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.ok(route.includes('export async function DELETE'));
  assert.ok(client.includes("topluIslem('delete')"));
  assert.ok(client.includes("action === 'delete' ? { confirm: 'SİL' }"));
  assert.ok(bulkRoute.includes("'unstar', 'delete'"));
  assert.ok(bulkRoute.includes("confirm: z.literal('SİL').optional()"));
  assert.ok(bulkRoute.includes("folder: 'trash'"));
  assert.ok(bulkRoute.includes('prisma.mailThread.deleteMany'));
  assert.ok(route.includes('blockSender'));
  assert.ok(leads.includes('formStartedAt'));
  assert.ok(leads.includes('recent >= 5'));
});

test('Havale talebi bildirim hatasını sessizce yutmuyor', () => {
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/purchase-request/route.js'), 'utf8');
  assert.ok(route.includes("console.error('[purchase-request] yönetici bildirimi gönderilemedi'"));
  assert.ok(route.includes("notificationError: notification.ok ? null : 'yonetici-bildirimi-gonderilemedi'"));
});

test('Ek hazırlanırken yeni ileti ve yanıt gönderimi kilitleniyor', () => {
  const client = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/posta/PostaClient.jsx'), 'utf8');
  assert.ok(client.includes('const attachmentBusyRef = useRef(false)'));
  assert.ok(client.includes('if (attachmentBusyRef.current)'));
  assert.ok(client.includes('disabled={sending || attachmentBusy}'));
  assert.ok(client.includes("attachmentBusy ? 'Ek hazırlanıyor…'"));
  assert.ok(client.includes("if (name.endsWith('.pdf')) return 'application/pdf'"));
});

console.log(`\n${passed} posta merkezi testi geçti.`);
