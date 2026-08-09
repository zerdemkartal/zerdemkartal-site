-- PayTR Link callback kaydı: ödeme mutabakatı için yalnız anonim işlem verileri.
-- Ad, e-posta, telefon, adres, TCKN/VKN ve kart verisi bu tabloda yer almaz.
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paytr_link',
    "merchantOid" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "deviceLimit" INTEGER NOT NULL,
    "netTargetKurus" INTEGER NOT NULL,
    "paymentAmountKurus" INTEGER NOT NULL,
    "totalAmountKurus" INTEGER NOT NULL,
    "paymentType" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentReceipt_merchantOid_key" ON "PaymentReceipt"("merchantOid");
CREATE INDEX "PaymentReceipt_status_paidAt_idx" ON "PaymentReceipt"("status", "paidAt");
