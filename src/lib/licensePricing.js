export const LICENSE_DEVICE_PRICES = Object.freeze({
  1: 8500,
  2: 11500
});

export const LICENSE_SECOND_DEVICE_PRICE = LICENSE_DEVICE_PRICES[2] - LICENSE_DEVICE_PRICES[1];
export const PURCHASE_TERMS_VERSION = '20260903';

export function normalizeDeviceLimit(value) {
  return Number(value) === 2 ? 2 : 1;
}

export function licensePriceFor(value) {
  return LICENSE_DEVICE_PRICES[normalizeDeviceLimit(value)];
}

export function licensePlanNameFor(value) {
  const device = normalizeDeviceLimit(value);
  return `Hermes Astroloji Programı - ${device} cihaz lisansı`;
}
