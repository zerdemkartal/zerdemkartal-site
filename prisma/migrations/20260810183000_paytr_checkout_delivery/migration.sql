-- PayTR kart ödemesini teslim e-postasına bağlayan en az veri kaydı.
-- Kart, adres, telefon, vergi/kimlik bilgisi tutulmaz.
CREATE TABLE "PaytrCheckout" (
  "id" TEXT NOT NULL,
  "requestId" UUID NOT NULL,
  "callbackId" VARCHAR(64) NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "termsVersion" TEXT NOT NULL,
  "deviceLimit" INTEGER NOT NULL,
  "netTargetKurus" INTEGER NOT NULL,
  "paymentAmountKurus" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "merchantOid" TEXT,
  "paymentReceiptId" TEXT,
  "downloadInviteId" TEXT,
  "paymentPageUrl" VARCHAR(500),
  "linkId" VARCHAR(128),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
  "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
  "deliverySentAt" TIMESTAMP(3),
  "deliveryError" VARCHAR(64),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaytrCheckout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaytrCheckout_deviceLimit_check" CHECK ("deviceLimit" IN (1, 2)),
  CONSTRAINT "PaytrCheckout_amounts_check" CHECK ("netTargetKurus" > 0 AND "paymentAmountKurus" > 0),
  CONSTRAINT "PaytrCheckout_status_check" CHECK ("status" IN ('pending', 'link_ready', 'paid', 'link_failed')),
  CONSTRAINT "PaytrCheckout_deliveryStatus_check" CHECK ("deliveryStatus" IN ('pending', 'sending', 'sent', 'failed')),
  CONSTRAINT "PaytrCheckout_deliveryAttempts_check" CHECK ("deliveryAttempts" >= 0)
);

CREATE UNIQUE INDEX "PaytrCheckout_requestId_key" ON "PaytrCheckout"("requestId");
CREATE UNIQUE INDEX "PaytrCheckout_callbackId_key" ON "PaytrCheckout"("callbackId");
CREATE UNIQUE INDEX "PaytrCheckout_merchantOid_key" ON "PaytrCheckout"("merchantOid");
CREATE UNIQUE INDEX "PaytrCheckout_paymentReceiptId_key" ON "PaytrCheckout"("paymentReceiptId");
CREATE UNIQUE INDEX "PaytrCheckout_downloadInviteId_key" ON "PaytrCheckout"("downloadInviteId");
CREATE INDEX "PaytrCheckout_email_createdAt_idx" ON "PaytrCheckout"("email", "createdAt");
CREATE INDEX "PaytrCheckout_status_expiresAt_idx" ON "PaytrCheckout"("status", "expiresAt");
CREATE INDEX "PaytrCheckout_deliveryStatus_updatedAt_idx" ON "PaytrCheckout"("deliveryStatus", "updatedAt");

ALTER TABLE "PaytrCheckout"
  ADD CONSTRAINT "PaytrCheckout_paymentReceiptId_fkey"
  FOREIGN KEY ("paymentReceiptId") REFERENCES "PaymentReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaytrCheckout"
  ADD CONSTRAINT "PaytrCheckout_downloadInviteId_fkey"
  FOREIGN KEY ("downloadInviteId") REFERENCES "DownloadInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
