import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PAYTR_LINK_CREATE_URL,
  PAYTR_RATES_URL,
  PAYTR_TERMS_VERSION,
  buildPaytrLinkRequest,
  calculateGrossKurus,
  createPaytrCallbackId,
  decodePaytrCallbackId,
  extractSingleRatio,
  fetchPaytrSingleRatio,
  getPaytrConfig,
  getPaytrPricing,
  resetPaytrRateCacheForTests,
  verifyPaytrCallbackHash
} from '../src/lib/paytr.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const passed = [];
const env = {
  SITE_URL: 'https://hermesastroloji.com',
  PAYTR_MERCHANT_ID: '123456',
  PAYTR_MERCHANT_KEY: 'test-key-not-production',
  PAYTR_MERCHANT_SALT: 'test-salt-not-production',
  PAYTR_MAX_INSTALLMENT: '12',
  PAYTR_DEBUG: '1',
  PAYTR_PRICE_BUFFER_PERCENT: '0',
  PAYTR_SINGLE_RATIO_FALLBACK: ''
};

async function test(name, fn) {
  await fn();
  passed.push(name);
  console.log(`✓ ${name}`);
}

await test('PayTR uçları yalnız resmî HTTPS adreslerini kullanıyor', () => {
  assert.equal(PAYTR_LINK_CREATE_URL, 'https://www.paytr.com/odeme/api/link/create');
  assert.equal(PAYTR_RATES_URL, 'https://www.paytr.com/odeme/taksit-oranlari');
});

await test('Tek çekim oranı farklı resmî yanıt yazımlarından okunuyor', () => {
  assert.equal(extractSingleRatio({ status: 'success', single_ratio: '4,50' }), 4.5);
  assert.equal(extractSingleRatio({ data: { tek_çekim_oranı: '3.25%' } }), 3.25);
  assert.throws(() => extractSingleRatio({ status: 'success', oranlar: [] }));
});

await test('Kart fiyatı PayTR kesintisinden sonra EFT hedefini koruyacak şekilde yukarı yuvarlanıyor', () => {
  const gross = calculateGrossKurus(6000, 4.5);
  assert.equal(gross, Math.ceil(600000 / 0.955));
  assert.ok(gross * 0.955 >= 600000);
  assert.throws(() => calculateGrossKurus(6000, 100));
});

await test('Boş oran yedeği sıfır sayılmıyor ve ilk servis hatasında ödeme kapalı kalıyor', async () => {
  assert.ok(Number.isNaN(getPaytrConfig(env).singleRatioFallback));
  resetPaytrRateCacheForTests();
  await assert.rejects(() => fetchPaytrSingleRatio({
    env,
    fetchImpl: async () => { throw new Error('network'); },
    now: 1_000
  }));
});

await test('Eksik yapılandırma yalnız değişken adlarını bildiriyor, gizli değer döndürmüyor', async () => {
  const pricing = await getPaytrPricing({ env: { PAYTR_MERCHANT_ID: '123', PAYTR_MERCHANT_KEY: '', PAYTR_MERCHANT_SALT: '' } });
  assert.deepEqual(pricing.missingConfig, ['PAYTR_MERCHANT_KEY', 'PAYTR_MERCHANT_SALT']);
  assert.ok(!JSON.stringify(pricing).includes('123'));
});

await test('Oran sorgusu PII göndermeden imzalı single_ratio isteği yapıyor', async () => {
  resetPaytrRateCacheForTests();
  let request;
  const rate = await fetchPaytrSingleRatio({
    env,
    now: 2_000,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ status: 'success', single_ratio: '4.5' }) };
    }
  });
  assert.equal(rate.ratio, 4.5);
  assert.equal(request.url, PAYTR_RATES_URL);
  const keys = [...request.options.body.keys()];
  assert.deepEqual(keys.sort(), ['abroad_ratio', 'merchant_id', 'paytr_token', 'request_id', 'single_ratio'].sort());
});

await test('PayTR oran reddi güvenli hata kodunu taşıyor', async () => {
  resetPaytrRateCacheForTests();
  await assert.rejects(
    () => fetchPaytrSingleRatio({
      env,
      now: 3_000,
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ status: 'error', err_no: '006', err_msg: 'Zorunlu alan gecersiz.' })
      })
    }),
    (error) => {
      assert.equal(error.code, 'PAYTR_RATE_REJECTED');
      assert.equal(error.paytrErrorNo, '006');
      assert.equal(error.paytrReason, 'Zorunlu alan gecersiz.');
      return true;
    }
  );
});

await test('Callback kimliği yalnız plan/tutar/sözleşme sürümü ve rastgele değer taşıyor', () => {
  const callbackId = createPaytrCallbackId({
    deviceLimit: 1,
    netKurus: 600000,
    paymentKurus: 628273,
    nonce: 'A1B2C3D4E5F6A7B8'
  });
  assert.match(callbackId, /^[a-zA-Z0-9]{1,64}$/);
  assert.ok(!callbackId.includes('@'));
  assert.deepEqual(decodePaytrCallbackId(callbackId), {
    callbackId,
    planId: 'hermes-1',
    deviceLimit: 1,
    netKurus: 600000,
    paymentKurus: 628273,
    termsVersion: PAYTR_TERMS_VERSION,
    testMode: false
  });
});

await test('10 TL test linki callback kimliginde test olarak isaretleniyor', () => {
  const callbackId = createPaytrCallbackId({
    deviceLimit: 1,
    netKurus: 1000,
    paymentKurus: 1000,
    nonce: 'T1E2S3T4L5I6N7K8',
    testMode: true
  });
  assert.match(callbackId, /^HT1/);
  assert.deepEqual(decodePaytrCallbackId(callbackId), {
    callbackId,
    planId: 'hermes-test',
    deviceLimit: 1,
    netKurus: 1000,
    paymentKurus: 1000,
    termsVersion: PAYTR_TERMS_VERSION,
    testMode: true
  });
});

await test('Link Create gövdesinde müşteri, fatura, kart veya pft alanı bulunmuyor', () => {
  const callbackId = createPaytrCallbackId({
    deviceLimit: 2, netKurus: 850000, paymentKurus: 890053, nonce: 'B1C2D3E4F5A6B7C8'
  });
  const body = buildPaytrLinkRequest({ deviceLimit: 2, paymentKurus: 890053, callbackId, env, now: 0 });
  const keys = [...body.keys()];
  for (const forbidden of ['email', 'user_name', 'name_surname', 'phone', 'address', 'identity_number', 'card_number', 'pft']) {
    assert.ok(!keys.includes(forbidden), `${forbidden} gönderilmemeli`);
  }
  assert.equal(body.get('link_type'), 'product');
  assert.equal(body.get('min_count'), '1');
  assert.equal(body.get('max_count'), '1');
  assert.equal(body.get('callback_link'), 'https://hermesastroloji.com/api/pay/paytr/callback');
});

await test('Yonetici test linki 10 TL, tek cekim ve lisans disi adla uretiliyor', () => {
  const callbackId = createPaytrCallbackId({
    deviceLimit: 1, netKurus: 1000, paymentKurus: 1000, nonce: 'T1E2S3T4L5I6N7K8', testMode: true
  });
  const body = buildPaytrLinkRequest({
    deviceLimit: 1, paymentKurus: 1000, callbackId, testMode: true, env, now: 0
  });
  assert.equal(body.get('price'), '1000');
  assert.equal(body.get('max_installment'), '1');
  assert.equal(body.get('name'), 'Hermes callback testi - lisans degildir');
  assert.equal(body.get('callback_id'), callbackId);
});

await test('Test link ucu yonetici korumali ve callback kaydi test olarak ayriliyor', () => {
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/pay/paytr/test-link/route.js'), 'utf8');
  const callback = fs.readFileSync(path.join(ROOT, 'src/app/api/pay/paytr/callback/route.js'), 'utf8');
  assert.ok(route.includes('requireAdmin(request)'));
  assert.ok(route.indexOf('requireAdmin(request)') < route.indexOf('createPaytrLink({'));
  assert.ok(route.includes('TEST_PAYMENT_KURUS = 1000'));
  assert.ok(route.includes('testMode: true'));
  assert.ok(callback.includes("const testMode = callback.testMode || fields.test_mode === '1'"));
});

await test('Yonetim paneli 10 TL test linkini oturum anahtariyla aciyor', () => {
  const panel = fs.readFileSync(path.join(ROOT, 'src/app/yonetim/YonetimClient.jsx'), 'utf8');
  assert.ok(panel.includes("fetch('/api/pay/paytr/test-link'"));
  assert.ok(panel.includes("sessionStorage.getItem(KEY)"));
  assert.ok(panel.includes('Authorization: `Bearer ${token}`'));
  assert.ok(panel.includes('10 TL test bağlantısı oluştur'));
  assert.ok(panel.includes('role="status"'));
  assert.ok(panel.includes('aria-live="polite"'));
});

await test('Callback HMAC doğrulaması değiştirilmiş tutarı reddediyor', () => {
  const fields = {
    callback_id: 'H11example', merchant_oid: 'oid123', status: 'success', total_amount: '650000'
  };
  fields.hash = createHmac('sha256', env.PAYTR_MERCHANT_KEY)
    .update(`${fields.callback_id}${fields.merchant_oid}${env.PAYTR_MERCHANT_SALT}${fields.status}${fields.total_amount}`)
    .digest('base64');
  assert.equal(verifyPaytrCallbackHash(fields, env), true);
  assert.equal(verifyPaytrCallbackHash({ ...fields, total_amount: '1' }, env), false);
});

await test('Kamusal satın alma akışı ödeme öncesi teslim ve fatura bilgisini doğruluyor', () => {
  const form = fs.readFileSync(path.join(ROOT, 'src/app/satin-al/SatinAlForm.jsx'), 'utf8');
  const link = fs.readFileSync(path.join(ROOT, 'src/app/api/pay/paytr/link/route.js'), 'utf8');
  const purchase = fs.readFileSync(path.join(ROOT, 'src/app/api/purchase-request/route.js'), 'utf8');
  const orders = fs.readFileSync(path.join(ROOT, 'src/app/api/orders/route.js'), 'utf8');
  const iyzico = fs.readFileSync(path.join(ROOT, 'src/app/api/pay/iyzico/start/route.js'), 'utf8');
  for (const field of ['taxNumber', 'billingAddress', 'companyTitle', 'phone', 'invoiceType']) {
    assert.ok(form.includes(field));
  }
  for (const route of [orders, iyzico]) {
    assert.ok(route.includes('status: 410'));
    assert.ok(!route.includes('request.json'));
  }
  assert.ok(purchase.includes('request.json'));
  assert.ok(purchase.includes('ingestPurchaseRequest'));
  assert.ok(purchase.includes('purchaseRequestNotificationEmail'));
  assert.ok(form.includes('Ad soyad'));
  assert.ok(form.includes('E-postayı doğrula'));
  assert.ok(form.includes('requestId: globalThis.crypto.randomUUID()'));
  assert.ok(form.includes("fetch('/api/pay/paytr/link'"));
  assert.ok(form.includes('termsVersion: pricing.termsVersion'));
  assert.ok(link.includes('adSoyad: z.string().trim().min(2).max(120)'));
  assert.ok(link.includes('email: z.string().trim().email().max(254)'));
  assert.ok(link.includes("invoiceType: z.enum(['individual', 'corporate'])"));
  assert.ok(link.includes('billingAddress: z.string().trim().min(10).max(500)'));
  assert.ok(link.includes('requestId: z.string().uuid()'));
  assert.ok(link.includes('prisma.paytrCheckout.create'));
});

await test('Makbuz kart verisi tutmuyor; checkout teslim ve fatura alanlarını içeriyor', () => {
  const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf8');
  const receipt = schema.slice(schema.indexOf('model PaymentReceipt'), schema.indexOf('model PaytrCheckout'));
  const checkout = schema.slice(schema.indexOf('model PaytrCheckout'), schema.indexOf('// Müşterinin indirme'));
  const legal = fs.readFileSync(path.join(ROOT, 'src/app/yasal/[slug]/page.jsx'), 'utf8');
  assert.ok(receipt.includes('merchantOid'));
  assert.ok(receipt.includes('termsVersion'));
  assert.ok(receipt.includes('paymentAmountKurus'));
  for (const forbidden of ['name ', 'email ', 'phone ', 'address ', 'taxNumber ', 'identityNumber ']) {
    assert.ok(!receipt.includes(forbidden));
  }
  assert.match(checkout, /\bname\s+String\b/);
  assert.match(checkout, /\bemail\s+String\b/);
  for (const required of ['phone', 'invoiceType', 'taxNumber', 'billingAddress', 'billingDistrict', 'billingCity']) {
    assert.match(checkout, new RegExp(`\\b${required}\\s+String`));
  }
  for (const forbidden of ['cardNumber ', 'cardExpiry ', 'cvv ']) {
    assert.ok(!checkout.includes(forbidden));
  }
  assert.ok(legal.includes("'on-bilgilendirme'"));
  assert.ok(legal.includes('teslimat:'));
  assert.ok(legal.includes('72 saat geçerli kişisel indirme daveti'));
  assert.ok(legal.includes('telefon, fatura türü, TCKN veya VKN'));
  assert.ok(!legal.includes('[kullanılan analitik aracı]'));
  assert.ok(!legal.includes('yayımdan önce'));
});

await test('Callback ödemeyi kilitleyip checkout ile eşliyor ve e-posta hatasında yeniden deniyor', () => {
  const callback = fs.readFileSync(path.join(ROOT, 'src/app/api/pay/paytr/callback/route.js'), 'utf8');
  const migration = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260810183000_paytr_checkout_delivery/migration.sql'), 'utf8');
  const billingMigration = fs.readFileSync(path.join(ROOT, 'prisma/migrations/20260811160000_paytr_checkout_billing/migration.sql'), 'utf8');
  assert.ok(callback.includes('pg_advisory_xact_lock'));
  assert.ok(callback.includes('tx.paytrCheckout.findUnique'));
  assert.ok(callback.includes('isSameCheckout(checkout, callback)'));
  assert.ok(callback.includes('deliverPaytrCheckout'));
  assert.ok(callback.includes("return plain('RETRY', 500)"));
  assert.ok(migration.includes('CREATE TABLE "PaytrCheckout"'));
  assert.ok(migration.includes('"requestId" UUID NOT NULL'));
  assert.ok(migration.includes('"paymentReceiptId" TEXT'));
  assert.ok(migration.includes('"downloadInviteId" TEXT'));
  assert.ok(billingMigration.includes('ADD COLUMN "invoiceType"'));
  assert.ok(billingMigration.includes('ADD COLUMN "billingAddress"'));
});

console.log(`\nSONUÇ: ${passed.length}/${passed.length} PayTR gizlilik, fiyatlandırma ve teslimat kontrolü geçti.`);
