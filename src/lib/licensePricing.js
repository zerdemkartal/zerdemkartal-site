export const LICENSE_DEVICE_PRICES = Object.freeze({
  1: 6000,
  2: 8500
});

export function normalizeDeviceLimit(value) {
  return Number(value) === 2 ? 2 : 1;
}

export function licensePriceFor(value) {
  return LICENSE_DEVICE_PRICES[normalizeDeviceLimit(value)];
}
