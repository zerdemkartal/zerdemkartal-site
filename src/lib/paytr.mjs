import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  LICENSE_DEVICE_PRICES,
  PURCHASE_TERMS_VERSION,
  licensePlanNameFor,
  normalizeDeviceLimit
} from './licensePricing.js';

export const PAYTR_LINK_CREATE_URL = 'https://www.paytr.com/odeme/api/link/create';
export const PAYTR_RATES_URL = 'https://www.paytr.com/odeme/taksit-oranlari';
export const PAYTR_TERMS_VERSION = PURCHASE_TERMS_VERSION;
export const PAYTR_RATE_CACHE_MS = 60 * 60 * 1000;
export const PAYTR_STALE_RATE_MS = 24 * 60 * 60 * 1000;
export const PAYTR_LINK_TTL_MS = 30 * 60 * 1000;

let rateCache = null;

function requiredEnv(value) {
  return String(value || '').trim();
}

function numberEnv(value, fallback = 0) {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  const parsed = Number(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getPaytrConfig(env = process.env) {
  const merchantId = requiredEnv(env.PAYTR_MERCHANT_ID);
  const merchantKey = requiredEnv(env.PAYTR_MERCHANT_KEY);
  const merchantSalt = requiredEnv(env.PAYTR_MERCHANT_SALT);
  const siteUrl = requiredEnv(env.SITE_URL || 'https://hermesastroloji.com').replace(/\/$/, '');
  const maxInstallment = Math.min(12, Math.max(1, Math.trunc(numberEnv(env.PAYTR_MAX_INSTALLMENT, 12))));

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    siteUrl,
    maxInstallment,
    debugOn: env.PAYTR_DEBUG === '1' ? '1' : '0',
    priceBufferPercent: Math.max(0, numberEnv(env.PAYTR_PRICE_BUFFER_PERCENT, 0)),
    singleRatioFallback: numberEnv(env.PAYTR_SINGLE_RATIO_FALLBACK, NaN),
    configured: Boolean(merchantId && merchantKey && merchantSalt)
  };
}

export function paytrConfigured(env = process.env) {
  return getPaytrConfig(env).configured;
}

export function hmacBase64(key, value) {
  return createHmac('sha256', key).update(value, 'utf8').digest('base64');
}

function parseRatio(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  return Number(value.trim().replace('%', '').replace(',', '.'));
}

export function extractSingleRatio(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('PayTR oran yanıtı geçersiz.');
  }

  const acceptedKeys = new Set([
    'singleratio',
    'tekcekim',
    'tekcekimorani',
    'tekcekimkomisyonorani'
  ]);
  const queue = [payload];
  const seen = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    for (const [key, value] of Object.entries(current)) {
      const normalizedKey = key.toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i').replace(/ç/g, 'c').replace(/ş/g, 's')
        .replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/[^a-z0-9]/g, '');
      if (acceptedKeys.has(normalizedKey)) {
        const ratio = parseRatio(value);
        if (Number.isFinite(ratio) && ratio >= 0 && ratio < 100) return ratio;
      }
      if (value && typeof value === 'object') queue.push(value);
    }
  }

  throw new Error('PayTR tek çekim oranı yanıtta bulunamadı.');
}

export function calculateGrossKurus(netTl, ratioPercent, bufferPercent = 0) {
  const netKurus = Math.round(Number(netTl) * 100);
  const effectiveRatio = (Number(ratioPercent) + Number(bufferPercent || 0)) / 100;
  if (!Number.isSafeInteger(netKurus) || netKurus <= 0) throw new Error('Net fiyat geçersiz.');
  if (!Number.isFinite(effectiveRatio) || effectiveRatio < 0 || effectiveRatio >= 1) {
    throw new Error('PayTR oranı geçersiz.');
  }
  return Math.ceil(netKurus / (1 - effectiveRatio));
}

function randomRequestId() {
  return `${Date.now().toString(36)}${randomBytes(8).toString('hex')}`.slice(0, 32);
}

export async function fetchPaytrSingleRatio({ env = process.env, fetchImpl = fetch, now = Date.now() } = {}) {
  const config = getPaytrConfig(env);
  if (!config.configured) throw new Error('PayTR yapılandırılmadı.');

  if (rateCache && now - rateCache.fetchedAt < PAYTR_RATE_CACHE_MS) {
    return { ...rateCache, stale: false };
  }

  const requestId = randomRequestId();
  const paytrToken = hmacBase64(
    config.merchantKey,
    `${config.merchantId}${requestId}${config.merchantSalt}`
  );
  const body = new URLSearchParams({
    merchant_id: config.merchantId,
    request_id: requestId,
    paytr_token: paytrToken,
    single_ratio: '1',
    abroad_ratio: '0'
  });

  try {
    const response = await fetchImpl(PAYTR_RATES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error('PayTR oran servisi yanıt vermedi.');
    const payload = await response.json();
    if (String(payload?.status || '').toLowerCase() !== 'success') {
      const error = new Error('PayTR oran servisi isteği reddetti.');
      error.code = 'PAYTR_RATE_REJECTED';
      error.paytrErrorNo = String(payload?.err_no || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
      error.paytrReason = String(payload?.err_msg || payload?.reason || '')
        .replace(/[\r\n\t]+/g, ' ')
        .slice(0, 240);
      throw error;
    }
    const ratio = extractSingleRatio(payload);
    rateCache = { ratio, fetchedAt: now, source: 'paytr' };
    return { ...rateCache, stale: false };
  } catch (error) {
    if (rateCache && now - rateCache.fetchedAt < PAYTR_STALE_RATE_MS) {
      return { ...rateCache, stale: true };
    }
    if (Number.isFinite(config.singleRatioFallback) && config.singleRatioFallback >= 0) {
      return { ratio: config.singleRatioFallback, fetchedAt: now, source: 'fallback', stale: true };
    }
    throw error;
  }
}

export async function getPaytrPricing(options = {}) {
  const env = options.env || process.env;
  const config = getPaytrConfig(env);
  if (!config.configured) {
    const missingConfig = [
      !config.merchantId && 'PAYTR_MERCHANT_ID',
      !config.merchantKey && 'PAYTR_MERCHANT_KEY',
      !config.merchantSalt && 'PAYTR_MERCHANT_SALT'
    ].filter(Boolean);
    return {
      configured: false,
      missingConfig,
      termsVersion: PAYTR_TERMS_VERSION,
      maxInstallment: config.maxInstallment,
      plans: Object.entries(LICENSE_DEVICE_PRICES).map(([deviceLimit, eftPrice]) => ({
        planId: `hermes-${deviceLimit}`,
        deviceLimit: Number(deviceLimit),
        eftPrice,
        cardPrice: null
      }))
    };
  }

  const rate = await fetchPaytrSingleRatio(options);
  return {
    configured: true,
    termsVersion: PAYTR_TERMS_VERSION,
    maxInstallment: config.maxInstallment,
    ratio: rate.ratio,
    rateSource: rate.source,
    rateStale: rate.stale,
    asOf: new Date(rate.fetchedAt).toISOString(),
    plans: Object.entries(LICENSE_DEVICE_PRICES).map(([deviceLimit, eftPrice]) => {
      const cardKurus = calculateGrossKurus(eftPrice, rate.ratio, config.priceBufferPercent);
      return {
        planId: `hermes-${deviceLimit}`,
        deviceLimit: Number(deviceLimit),
        eftPrice,
        cardPrice: cardKurus / 100,
        cardKurus
      };
    })
  };
}

function base36(value, width) {
  return Number(value).toString(36).padStart(width, '0');
}

export function createPaytrCallbackId({
  deviceLimit,
  netKurus,
  paymentKurus,
  termsVersion = PAYTR_TERMS_VERSION,
  nonce,
  testMode = false
} = {}) {
  const device = normalizeDeviceLimit(deviceLimit);
  const cleanTerms = String(termsVersion).replace(/\D/g, '');
  const cleanNonce = String(nonce || randomBytes(10).toString('hex')).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
  if (cleanTerms.length !== 8 || cleanNonce.length < 12) throw new Error('Callback kimliği üretilemedi.');
  if (![netKurus, paymentKurus].every((value) => Number.isSafeInteger(value) && value > 0)) {
    throw new Error('Callback tutarı geçersiz.');
  }
  const mode = testMode ? 'T' : '1';
  const callbackId = `H${mode}${device}${base36(netKurus, 7)}${base36(paymentKurus, 7)}${cleanTerms}${cleanNonce}`;
  if (!/^[a-zA-Z0-9]{1,64}$/.test(callbackId)) throw new Error('Callback kimliği geçersiz.');
  return callbackId;
}

export function decodePaytrCallbackId(value) {
  const callbackId = String(value || '');
  const match = /^H([1T])([12])([a-z0-9]{7})([a-z0-9]{7})(\d{8})([a-zA-Z0-9]{12,20})$/.exec(callbackId);
  if (!match) throw new Error('Callback kimliği geçersiz.');
  const testMode = match[1] === 'T';
  const deviceLimit = Number(match[2]);
  const netKurus = Number.parseInt(match[3], 36);
  const paymentKurus = Number.parseInt(match[4], 36);
  if (![netKurus, paymentKurus].every(Number.isSafeInteger)) throw new Error('Callback tutarı geçersiz.');
  return {
    callbackId,
    planId: testMode ? 'hermes-test' : `hermes-${deviceLimit}`,
    deviceLimit,
    netKurus,
    paymentKurus,
    termsVersion: match[5],
    testMode
  };
}

function istanbulExpiry(minutes = PAYTR_LINK_TTL_MS / 60_000, now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date(now + minutes * 60_000));
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

export function buildPaytrLinkRequest({
  deviceLimit,
  paymentKurus,
  callbackId,
  testMode = false,
  env = process.env,
  now = Date.now()
}) {
  const config = getPaytrConfig(env);
  if (!config.configured) throw new Error('PayTR yapılandırılmadı.');
  const device = normalizeDeviceLimit(deviceLimit);
  const name = testMode ? 'Hermes callback testi - lisans degildir' : licensePlanNameFor(device);
  const price = String(paymentKurus);
  const currency = 'TL';
  const maxInstallment = testMode ? '1' : String(config.maxInstallment);
  const linkType = 'product';
  const lang = 'tr';
  const minCount = '1';
  const required = `${name}${price}${currency}${maxInstallment}${linkType}${lang}${minCount}`;

  return new URLSearchParams({
    merchant_id: config.merchantId,
    name,
    price,
    currency,
    max_installment: maxInstallment,
    link_type: linkType,
    lang,
    min_count: minCount,
    max_count: '1',
    expiry_date: istanbulExpiry(30, now),
    callback_link: `${config.siteUrl}/api/pay/paytr/callback`,
    callback_id: callbackId,
    debug_on: config.debugOn,
    paytr_token: hmacBase64(config.merchantKey, `${required}${config.merchantSalt}`)
  });
}

export async function createPaytrLink({
  deviceLimit,
  paymentKurus,
  callbackId,
  testMode = false,
  env = process.env,
  fetchImpl = fetch
}) {
  const body = buildPaytrLinkRequest({ deviceLimit, paymentKurus, callbackId, testMode, env });
  const response = await fetchImpl(PAYTR_LINK_CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error('PayTR link servisi yanıt vermedi.');
  const payload = await response.json();
  if (String(payload?.status || '').toLowerCase() !== 'success') {
    throw new Error('PayTR ödeme bağlantısını oluşturamadı.');
  }
  const paymentPageUrl = payload.url || payload.link;
  if (!/^https:\/\/www\.paytr\.com\/link\/[a-zA-Z0-9_-]+$/.test(String(paymentPageUrl || ''))) {
    throw new Error('PayTR güvenli ödeme adresi geçersiz.');
  }
  return { paymentPageUrl, linkId: String(payload.id || '') };
}

export function verifyPaytrCallbackHash(fields, env = process.env) {
  const config = getPaytrConfig(env);
  if (!config.configured) return false;
  const expected = hmacBase64(
    config.merchantKey,
    `${fields.callback_id}${fields.merchant_oid}${config.merchantSalt}${fields.status}${fields.total_amount}`
  );
  const actualBuffer = Buffer.from(String(fields.hash || ''), 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function resetPaytrRateCacheForTests() {
  rateCache = null;
}
