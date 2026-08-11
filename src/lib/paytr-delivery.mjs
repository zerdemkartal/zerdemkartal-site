import { createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  downloadInvitationEmail,
  paytrSaleNotificationEmail,
  salesNotificationRecipients
} from './email.js';
import { DOWNLOAD_INVITE_MS, downloadSecretHash } from './download-invite.mjs';

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function deliverySecret(env = process.env) {
  const value = String(env.PAYTR_DELIVERY_SECRET || '').trim();
  if (value.length < 32) throw new Error('paytr-teslim-sirri-eksik');
  return value;
}

function hmacBytes(secret, checkoutId, scope) {
  return createHmac('sha256', secret)
    .update(`hermes-paytr-delivery/v1\0${scope}\0${checkoutId}`, 'utf8')
    .digest();
}

export function derivePaytrDeliveryAccess(checkoutId, env = process.env) {
  const cleanId = String(checkoutId || '').trim();
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(cleanId)) throw new Error('paytr-checkout-kimligi-gecersiz');
  const secret = deliverySecret(env);
  const linkToken = hmacBytes(secret, cleanId, 'link').toString('base64url');
  const passwordBytes = hmacBytes(secret, cleanId, 'password');
  const passwordText = Array.from(passwordBytes.subarray(0, 16), (byte) => (
    PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]
  )).join('');
  const temporaryPassword = passwordText.match(/.{4}/g).join('-');
  return { linkToken, temporaryPassword };
}

async function ensureCheckoutInvite({ database, checkoutId, env, now }) {
  const secrets = derivePaytrDeliveryAccess(checkoutId, env);
  const linkTokenHash = downloadSecretHash(secrets.linkToken, 'link');
  const passwordHash = await bcrypt.hash(secrets.temporaryPassword, 12);

  return database.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`paytr-delivery:${checkoutId}`}))`;
    const checkout = await tx.paytrCheckout.findUnique({
      where: { id: checkoutId },
      include: { downloadInvite: true, paymentReceipt: true }
    });
    if (!checkout || checkout.status !== 'paid' || !checkout.paymentReceipt) {
      throw new Error('paytr-odeme-kaydi-hazir-degil');
    }
    if (checkout.deliverySentAt && checkout.downloadInvite) {
      return { checkout, invite: checkout.downloadInvite, secrets, repeated: true };
    }

    let invite = checkout.downloadInvite;
    if (!invite) {
      const passwordExpiresAt = new Date(now.getTime() + DOWNLOAD_INVITE_MS);
      await tx.downloadInvite.updateMany({
        where: {
          application: 'hermes',
          email: checkout.email,
          revokedAt: null,
          NOT: { linkTokenHash }
        },
        data: { revokedAt: now }
      });
      invite = await tx.downloadInvite.create({
        data: {
          name: checkout.name,
          email: checkout.email,
          application: 'hermes',
          linkTokenHash,
          passwordHash,
          passwordExpiresAt,
          createdByRef: `paytr:${checkout.id}`
        }
      });
    }

    const updated = await tx.paytrCheckout.update({
      where: { id: checkout.id },
      data: {
        downloadInviteId: invite.id,
        deliveryStatus: 'sending',
        deliveryAttempts: { increment: 1 },
        deliveryError: null
      },
      include: { paymentReceipt: true }
    });
    return { checkout: updated, invite, secrets, repeated: false };
  }, { timeout: 15000 });
}

async function sendCustomerInvitation({ database, prepared, sendInvitation, now }) {
  if (prepared.repeated) return { ok: true, repeated: true, emailId: null };

  const access = {
    ...prepared.secrets,
    invite: prepared.invite,
    passwordExpiresAt: prepared.invite.passwordExpiresAt
  };
  const receipt = prepared.checkout.paymentReceipt;
  const sent = await sendInvitation({
    recipient: {
      id: receipt.merchantOid,
      name: prepared.checkout.name,
      email: prepared.checkout.email,
      price: receipt.totalAmountKurus / 100
    },
    access,
    paymentConfirmed: true,
    idempotencyKey: `paytr-delivery-${prepared.checkout.id}`
  });

  if (!sent.ok) {
    const errorCode = sent.skipped ? 'email-not-configured' : 'email-send-failed';
    await database.paytrCheckout.update({
      where: { id: prepared.checkout.id },
      data: { deliveryStatus: 'failed', deliveryError: errorCode }
    }).catch(() => {});
    return { ok: false, error: errorCode };
  }

  await database.$transaction(async (tx) => {
    await tx.downloadInvite.update({
      where: { id: prepared.invite.id },
      data: { sentAt: prepared.invite.sentAt || now }
    });
    await tx.paytrCheckout.update({
      where: { id: prepared.checkout.id },
      data: {
        deliveryStatus: 'sent',
        deliverySentAt: prepared.checkout.deliverySentAt || now,
        deliveryError: null
      }
    });
  });
  return { ok: true, repeated: false, emailId: sent.id || null };
}

async function prepareSaleNotification({ database, checkoutId }) {
  return database.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`paytr-sale-notification:${checkoutId}`}))`;
    const checkout = await tx.paytrCheckout.findUnique({
      where: { id: checkoutId },
      include: { paymentReceipt: true }
    });
    if (!checkout || checkout.status !== 'paid' || !checkout.paymentReceipt) {
      throw new Error('paytr-odeme-kaydi-hazir-degil');
    }
    if (checkout.salesNotificationSentAt) return { checkout, repeated: true };

    const updated = await tx.paytrCheckout.update({
      where: { id: checkout.id },
      data: {
        salesNotificationStatus: 'sending',
        salesNotificationAttempts: { increment: 1 },
        salesNotificationError: null
      },
      include: { paymentReceipt: true }
    });
    return { checkout: updated, repeated: false };
  }, { timeout: 15000 });
}

async function sendSaleNotice({ database, checkoutId, env, sendSaleNotification, now }) {
  const prepared = await prepareSaleNotification({ database, checkoutId });
  if (prepared.repeated) return { ok: true, repeated: true, emailId: null };

  const recipients = salesNotificationRecipients(env);
  const sent = await sendSaleNotification({
    recipients,
    checkout: prepared.checkout,
    receipt: prepared.checkout.paymentReceipt,
    idempotencyKey: `paytr-sale-${prepared.checkout.id}`
  });
  if (!sent.ok) {
    const errorCode = recipients.length === 0
      ? 'sales-recipients-missing'
      : sent.skipped ? 'email-not-configured' : 'sales-email-send-failed';
    await database.paytrCheckout.update({
      where: { id: prepared.checkout.id },
      data: { salesNotificationStatus: 'failed', salesNotificationError: errorCode }
    }).catch(() => {});
    return { ok: false, error: errorCode };
  }

  await database.paytrCheckout.update({
    where: { id: prepared.checkout.id },
    data: {
      salesNotificationStatus: 'sent',
      salesNotificationSentAt: prepared.checkout.salesNotificationSentAt || now,
      salesNotificationError: null
    }
  });
  return { ok: true, repeated: false, emailId: sent.id || null };
}

export async function deliverPaytrCheckout({
  database,
  checkoutId,
  env = process.env,
  sendInvitation = downloadInvitationEmail,
  sendSaleNotification = paytrSaleNotificationEmail,
  now = new Date()
}) {
  const prepared = await ensureCheckoutInvite({ database, checkoutId, env, now });
  const [customer, sale] = await Promise.all([
    sendCustomerInvitation({ database, prepared, sendInvitation, now }),
    sendSaleNotice({ database, checkoutId, env, sendSaleNotification, now })
  ]);
  if (!customer.ok) return customer;
  if (!sale.ok) return sale;
  return {
    ok: true,
    repeated: customer.repeated && sale.repeated,
    emailId: customer.emailId || null,
    notificationEmailId: sale.emailId || null
  };
}
