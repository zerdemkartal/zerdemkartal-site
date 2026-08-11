import assert from 'node:assert/strict';
import {
  deliverPaytrCheckout,
  derivePaytrDeliveryAccess
} from '../src/lib/paytr-delivery.mjs';

const env = {
  PAYTR_DELIVERY_SECRET: 'test-only-paytr-delivery-secret-32-bytes-minimum',
  SALES_NOTIFICATION_EMAILS: 'yonetici1@example.com, yonetici2@example.com'
};
const now = new Date('2026-08-10T18:00:00.000Z');

function makeDatabase(id = 'checkout_test_123456') {
  const state = {
    checkout: {
      id,
      name: 'Özgür Işık',
      email: 'ozgur@example.com',
      phone: '+905551112233',
      invoiceType: 'individual',
      companyTitle: null,
      taxNumber: '12345678901',
      taxOffice: null,
      billingAddress: 'Örnek Mahallesi 10/2',
      billingDistrict: 'Mezitli',
      billingCity: 'Mersin',
      status: 'paid',
      planId: 'hermes-1-cihaz',
      deviceLimit: 1,
      deliveryStatus: 'pending',
      deliveryAttempts: 0,
      deliverySentAt: null,
      deliveryError: null,
      salesNotificationStatus: 'pending',
      salesNotificationAttempts: 0,
      salesNotificationSentAt: null,
      salesNotificationError: null,
      downloadInviteId: null,
      paymentReceipt: {
        merchantOid: 'merchant-order-1',
        paymentAmountKurus: 625000,
        totalAmountKurus: 625000,
        paymentType: 'card',
        currency: 'TL',
        paidAt: now
      }
    },
    invite: null,
    revoked: 0
  };

  const paytrCheckout = {
    findUnique: async () => ({
      ...state.checkout,
      downloadInvite: state.invite,
      paymentReceipt: state.checkout.paymentReceipt
    }),
    update: async ({ data }) => {
      for (const [key, value] of Object.entries(data)) {
        state.checkout[key] = value?.increment
          ? Number(state.checkout[key] || 0) + value.increment
          : value;
      }
      return { ...state.checkout, paymentReceipt: state.checkout.paymentReceipt };
    }
  };
  const downloadInvite = {
    updateMany: async () => { state.revoked += 1; },
    create: async ({ data }) => {
      state.invite = { id: 'invite_test_1', sentAt: null, ...data };
      return state.invite;
    },
    update: async ({ data }) => {
      Object.assign(state.invite, data);
      return state.invite;
    }
  };
  const tx = {
    $executeRaw: async () => 1,
    paytrCheckout,
    downloadInvite
  };
  const database = {
    paytrCheckout,
    $transaction: async (fn) => fn(tx)
  };
  return { database, state };
}

const first = derivePaytrDeliveryAccess('checkout_test_123456', env);
const second = derivePaytrDeliveryAccess('checkout_test_123456', env);
assert.deepEqual(first, second);
assert.match(first.linkToken, /^[a-zA-Z0-9_-]{43}$/);
assert.match(first.temporaryPassword, /^[A-Za-z0-9]{4}(?:-[A-Za-z0-9]{4}){3}$/);
assert.throws(() => derivePaytrDeliveryAccess('checkout_test_123456', { PAYTR_DELIVERY_SECRET: 'short' }));
console.log('✓ Teslim bağlantısı ve parola aynı ödeme için deterministik ve gizli anahtara bağlı');

{
  const { database, state } = makeDatabase();
  const sent = [];
  const saleNotices = [];
  const sendInvitation = async (payload) => {
    sent.push(payload);
    return { ok: true, id: 'email_1' };
  };
  const sendSaleNotification = async (payload) => {
    saleNotices.push(payload);
    return { ok: true, id: 'sale_email_1' };
  };
  const result = await deliverPaytrCheckout({ database, checkoutId: state.checkout.id, env, now, sendInvitation, sendSaleNotification });
  assert.deepEqual(result, { ok: true, repeated: false, emailId: 'email_1', notificationEmailId: 'sale_email_1' });
  assert.equal(state.checkout.deliveryStatus, 'sent');
  assert.equal(state.checkout.deliveryAttempts, 1);
  assert.equal(state.checkout.salesNotificationStatus, 'sent');
  assert.equal(state.checkout.salesNotificationAttempts, 1);
  assert.equal(state.invite.sentAt.toISOString(), now.toISOString());
  assert.equal(sent.length, 1);
  assert.equal(saleNotices.length, 1);
  assert.equal(sent[0].recipient.email, 'ozgur@example.com');
  assert.equal(sent[0].idempotencyKey, `paytr-delivery-${state.checkout.id}`);
  assert.deepEqual(saleNotices[0].recipients, ['yonetici1@example.com', 'yonetici2@example.com']);
  assert.equal(saleNotices[0].idempotencyKey, `paytr-sale-${state.checkout.id}`);
  assert.equal(saleNotices[0].checkout.taxNumber, '12345678901');
  assert.equal(saleNotices[0].checkout.billingCity, 'Mersin');

  const repeated = await deliverPaytrCheckout({ database, checkoutId: state.checkout.id, env, now, sendInvitation, sendSaleNotification });
  assert.deepEqual(repeated, { ok: true, repeated: true, emailId: null, notificationEmailId: null });
  assert.equal(sent.length, 1);
  assert.equal(saleNotices.length, 1);
  assert.equal(state.checkout.deliveryAttempts, 1);
  assert.equal(state.checkout.salesNotificationAttempts, 1);
  console.log('✓ Başarılı callback müşteri ve yönetici postalarını bir kez üretir; tekrar bildirim idempotenttir');
}

{
  const { database, state } = makeDatabase('checkout_retry_123456');
  let calls = 0;
  const sendInvitation = async () => {
    calls += 1;
    return calls === 1 ? { ok: false, skipped: true } : { ok: true, id: 'email_retry' };
  };
  const sendSaleNotification = async () => ({ ok: true, id: 'sale_email_retry' });
  const failed = await deliverPaytrCheckout({ database, checkoutId: state.checkout.id, env, now, sendInvitation, sendSaleNotification });
  assert.deepEqual(failed, { ok: false, error: 'email-not-configured' });
  assert.equal(state.checkout.deliveryStatus, 'failed');
  assert.equal(state.checkout.salesNotificationStatus, 'sent');
  const inviteId = state.invite.id;

  const retried = await deliverPaytrCheckout({ database, checkoutId: state.checkout.id, env, now, sendInvitation, sendSaleNotification });
  assert.equal(retried.ok, true);
  assert.equal(state.invite.id, inviteId);
  assert.equal(state.checkout.deliveryAttempts, 2);
  assert.equal(state.checkout.deliveryStatus, 'sent');
  console.log('✓ Müşteri e-postası hatası aynı davetle güvenli biçimde yeniden denenir');
}

{
  const { database, state } = makeDatabase('checkout_sale_retry_123456');
  let saleCalls = 0;
  let customerCalls = 0;
  const sendInvitation = async () => {
    customerCalls += 1;
    return { ok: true, id: 'customer_sale_retry' };
  };
  const sendSaleNotification = async () => {
    saleCalls += 1;
    return saleCalls === 1 ? { ok: false, error: 'temporary' } : { ok: true, id: 'sale_retry' };
  };
  const failed = await deliverPaytrCheckout({ database, checkoutId: state.checkout.id, env, now, sendInvitation, sendSaleNotification });
  assert.deepEqual(failed, { ok: false, error: 'sales-email-send-failed' });
  assert.equal(state.checkout.deliveryStatus, 'sent');
  assert.equal(state.checkout.salesNotificationStatus, 'failed');

  const retried = await deliverPaytrCheckout({ database, checkoutId: state.checkout.id, env, now, sendInvitation, sendSaleNotification });
  assert.equal(retried.ok, true);
  assert.equal(customerCalls, 1);
  assert.equal(saleCalls, 2);
  assert.equal(state.checkout.salesNotificationAttempts, 2);
  assert.equal(state.checkout.salesNotificationStatus, 'sent');
  console.log('✓ Yönetici bildirimi hata verirse müşteri postası tekrarlanmadan yeniden denenir');
}

console.log('\nSONUÇ: 4/4 PayTR otomatik teslimat kontrolü geçti.');
