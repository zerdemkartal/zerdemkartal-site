import { prisma } from '@/lib/db';
import { deliverPaytrCheckout } from '@/lib/paytr-delivery.mjs';
import {
  decodePaytrCallbackId,
  getPaytrConfig,
  verifyPaytrCallbackHash
} from '@/lib/paytr.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const plain = (body, status = 200) => new Response(body, {
  status,
  headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
});

function textFields(form) {
  return Object.fromEntries([
    'hash', 'merchant_oid', 'status', 'total_amount', 'payment_amount',
    'payment_type', 'currency', 'callback_id', 'merchant_id', 'test_mode'
  ].map((key) => [key, String(form.get(key) || '')]));
}

function isSameReceipt(receipt, fields, paymentAmountKurus, totalAmountKurus) {
  return receipt?.callbackId === fields.callback_id &&
    receipt.paymentAmountKurus === paymentAmountKurus &&
    receipt.totalAmountKurus === totalAmountKurus;
}

function isSameCheckout(checkout, callback) {
  return checkout.callbackId === callback.callbackId &&
    checkout.planId === callback.planId &&
    checkout.termsVersion === callback.termsVersion &&
    checkout.deviceLimit === callback.deviceLimit &&
    checkout.netTargetKurus === callback.netKurus &&
    checkout.paymentAmountKurus === callback.paymentKurus;
}

async function persistPayment({ fields, callback, paymentAmountKurus, totalAmountKurus, testMode }) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`paytr-callback:${fields.merchant_oid}`}))`;
    const existing = await tx.paymentReceipt.findUnique({ where: { merchantOid: fields.merchant_oid } });
    if (existing && !isSameReceipt(existing, fields, paymentAmountKurus, totalAmountKurus)) {
      return { conflict: true };
    }

    const checkout = await tx.paytrCheckout.findUnique({ where: { callbackId: fields.callback_id } });
    if (checkout && !isSameCheckout(checkout, callback)) return { conflict: true };

    const receipt = existing || await tx.paymentReceipt.create({
      data: {
        merchantOid: fields.merchant_oid,
        callbackId: fields.callback_id,
        planId: callback.planId,
        termsVersion: callback.termsVersion,
        deviceLimit: callback.deviceLimit,
        netTargetKurus: callback.netKurus,
        paymentAmountKurus,
        totalAmountKurus,
        paymentType: fields.payment_type.slice(0, 32) || 'unknown',
        currency: fields.currency,
        testMode
      }
    });

    if (!checkout) return { receipt, checkoutId: null, testMode };
    const paidAt = checkout.paidAt || receipt.paidAt;
    await tx.paytrCheckout.update({
      where: { id: checkout.id },
      data: {
        status: 'paid',
        merchantOid: fields.merchant_oid,
        paymentReceiptId: receipt.id,
        paidAt,
        paymentPageUrl: null,
        ...(testMode ? { deliveryStatus: 'failed', deliveryError: 'paytr-test-mode' } : {})
      }
    });
    return { receipt, checkoutId: checkout.id, testMode };
  }, { timeout: 15000 });
}

export async function POST(request) {
  const config = getPaytrConfig();
  if (!config.configured) return plain('NOT CONFIGURED', 503);

  const fields = textFields(await request.formData().catch(() => new FormData()));
  if (fields.merchant_id !== config.merchantId || !verifyPaytrCallbackHash(fields)) {
    return plain('INVALID', 400);
  }
  if (fields.status !== 'success' || fields.currency !== 'TL') return plain('INVALID', 400);

  let callback;
  try {
    callback = decodePaytrCallbackId(fields.callback_id);
  } catch {
    return plain('INVALID', 400);
  }

  const paymentAmountKurus = Number(fields.payment_amount);
  const totalAmountKurus = Number(fields.total_amount);
  if (
    !/^[a-zA-Z0-9_-]{1,128}$/.test(fields.merchant_oid) ||
    !Number.isSafeInteger(paymentAmountKurus) ||
    !Number.isSafeInteger(totalAmountKurus) ||
    paymentAmountKurus !== callback.paymentKurus ||
    totalAmountKurus < paymentAmountKurus
  ) return plain('INVALID', 400);

  const testMode = callback.testMode || fields.test_mode === '1';
  try {
    const persisted = await persistPayment({
      fields,
      callback,
      paymentAmountKurus,
      totalAmountKurus,
      testMode
    });
    if (persisted.conflict) return plain('INVALID', 409);

    if (persisted.checkoutId && !persisted.testMode) {
      const delivery = await deliverPaytrCheckout({
        database: prisma,
        checkoutId: persisted.checkoutId
      });
      if (!delivery.ok) return plain('RETRY', 500);
    }
    return plain('OK');
  } catch (error) {
    console.error('[paytr-callback] geçici hata', String(error?.message || error));
    return plain('RETRY', 500);
  }
}
