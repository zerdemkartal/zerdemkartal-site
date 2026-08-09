import { PrismaClient } from '@prisma/client';
import { createLicenseEvent } from '../src/lib/license/events.mjs';

const prisma = new PrismaClient();
const CONFIRM = 'HERMES-LISANS-OLAY-HASH-V2';

async function main() {
  if (process.env.LICENSE_EVENT_REHASH_CONFIRM !== CONFIRM) {
    throw new Error(`LICENSE_EVENT_REHASH_CONFIRM=${CONFIRM} gerekli`);
  }
  const result = await prisma.$transaction(async (tx) => {
    const events = await tx.licenseEvent.findMany({
      orderBy: [{ licenseId: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
    });
    const previous = new Map();
    await tx.$executeRawUnsafe('ALTER TABLE "LicenseEvent" DISABLE TRIGGER "LicenseEvent_append_only_update"');
    try {
      for (const event of events) {
        const chainId = event.licenseId || 'global';
        const previousHash = previous.get(chainId) || null;
        const repaired = createLicenseEvent({
          licenseId: event.licenseId,
          actorId: event.actorId,
          actorRole: event.actorRole,
          action: event.action,
          outcome: event.outcome,
          reason: event.reason,
          beforeState: event.beforeState,
          afterState: event.afterState,
          requestId: event.requestId,
          previousHash,
          createdAt: event.createdAt
        });
        await tx.licenseEvent.update({
          where: { id: event.id },
          data: { previousHash, eventHash: repaired.eventHash }
        });
        previous.set(chainId, repaired.eventHash);
      }
    } finally {
      await tx.$executeRawUnsafe('ALTER TABLE "LicenseEvent" ENABLE TRIGGER "LicenseEvent_append_only_update"');
    }
    return { events: events.length, chains: previous.size };
  }, { timeout: 120000 });
  console.log(JSON.stringify({ tamam: true, canonicalVersion: 2, ...result }));
}

main().catch((error) => {
  console.error('Olay hash bakimi basarisiz: ' + error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
