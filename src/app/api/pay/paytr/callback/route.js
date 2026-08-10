import { prisma } from '@/lib/db';
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

  try {
    const existing = await prisma.paymentReceipt.findUnique({ where: { merchantOid: fields.merchant_oid } });
    if (existing) {
      return isSameReceipt(existing, fields, paymentAmountKurus, totalAmountKurus)
        ? plain('OK')
        : plain('INVALID', 409);
    }

    await prisma.paymentReceipt.create({
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
        testMode: callback.testMode || fields.test_mode === '1'
      }
    });
    return plain('OK');
  } catch (error) {
    if (error?.code === 'P2002') {
      const existing = await prisma.paymentReceipt.findUnique({ where: { merchantOid: fields.merchant_oid } });
      return isSameReceipt(existing, fields, paymentAmountKurus, totalAmountKurus)
        ? plain('OK')
        : plain('INVALID', 409);
    }
    return plain('RETRY', 500);
  }
}
