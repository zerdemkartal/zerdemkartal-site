import { createHmac, timingSafeEqual } from 'node:crypto';

const AZAMI_SAPMA_SANIYE = 5 * 60;

function guvenliEsit(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

/** Resend/Svix webhook imzasını ham istek gövdesi üzerinden doğrular. */
export function verifyResendWebhook(rawBody, headers, secret = process.env.RESEND_WEBHOOK_SECRET) {
  if (!secret) return false;
  const id = headers.get('svix-id') || '';
  const timestamp = headers.get('svix-timestamp') || '';
  const signature = headers.get('svix-signature') || '';
  const saniye = Number(timestamp);
  if (!id || !Number.isFinite(saniye) || !signature) return false;
  if (Math.abs(Date.now() / 1000 - saniye) > AZAMI_SAPMA_SANIYE) return false;

  let key;
  try {
    key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
  } catch {
    return false;
  }
  if (!key.length) return false;
  const beklenen = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest('base64');

  return signature.split(/\s+/).some((parca) => {
    const [surum, imza] = parca.split(',');
    return surum === 'v1' && imza && guvenliEsit(imza, beklenen);
  });
}
