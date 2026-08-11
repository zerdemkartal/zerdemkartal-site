DROP INDEX IF EXISTS "PaytrCheckout_salesNotificationStatus_updatedAt_idx";

ALTER TABLE "PaytrCheckout"
DROP COLUMN IF EXISTS "salesNotificationError",
DROP COLUMN IF EXISTS "salesNotificationSentAt",
DROP COLUMN IF EXISTS "salesNotificationAttempts",
DROP COLUMN IF EXISTS "salesNotificationStatus";
