import { sha256 } from './protocol.mjs';

export function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])]));
  }
  return value;
}

export function canonicalLicenseEvent(value) {
  return JSON.stringify({
    licenseId: value.licenseId || null,
    actorId: value.actorId || null,
    actorRole: value.actorRole || null,
    action: value.action,
    outcome: value.outcome,
    reason: value.reason || null,
    beforeState: value.beforeState ? canonicalJson(value.beforeState) : null,
    afterState: value.afterState ? canonicalJson(value.afterState) : null,
    requestId: value.requestId,
    previousHash: value.previousHash || null,
    createdAt: new Date(value.createdAt).toISOString()
  });
}

export function createLicenseEvent(value) {
  const event = { ...value };
  event.eventHash = sha256(Buffer.from(canonicalLicenseEvent(event), 'utf8'));
  return event;
}

export async function appendLicenseEvent(tx, value) {
  const chainId = value.licenseId || 'global';
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`license-event:${chainId}`}))`;
  const previous = await tx.licenseEvent.findFirst({
    where: value.licenseId ? { licenseId: value.licenseId } : { licenseId: null },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { eventHash: true }
  });
  const event = createLicenseEvent({
    ...value,
    previousHash: value.previousHash === undefined ? previous?.eventHash || null : value.previousHash
  });
  return tx.licenseEvent.create({ data: event });
}
