ALTER TABLE "PaytrCheckout"
ADD COLUMN "salesNotificationStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "salesNotificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "salesNotificationSentAt" TIMESTAMP(3),
ADD COLUMN "salesNotificationError" VARCHAR(64);

CREATE INDEX "PaytrCheckout_salesNotificationStatus_updatedAt_idx"
ON "PaytrCheckout"("salesNotificationStatus", "updatedAt");
