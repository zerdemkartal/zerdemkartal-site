-- Ödeme sonrası müşteri hesabı, tek kullanımlık parola kurulumu ve kısa ömürlü indirme oturumu.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentEmailSentAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "CustomerLicenseCredential" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "licenseNo" TEXT NOT NULL,
  "application" TEXT NOT NULL DEFAULT 'hermes',
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "setupTokenHash" CHAR(64),
  "setupExpiresAt" TIMESTAMP(3),
  "setupUsedAt" TIMESTAMP(3),
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "authVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerLicenseCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CustomerLicenseSession" (
  "id" TEXT NOT NULL,
  "credentialId" TEXT NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerLicenseSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerLicenseCredential_orderId_key"
  ON "CustomerLicenseCredential"("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerLicenseCredential_licenseNo_key"
  ON "CustomerLicenseCredential"("licenseNo");
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerLicenseCredential_setupTokenHash_key"
  ON "CustomerLicenseCredential"("setupTokenHash");
CREATE INDEX IF NOT EXISTS "CustomerLicenseCredential_email_idx"
  ON "CustomerLicenseCredential"("email");
CREATE INDEX IF NOT EXISTS "CustomerLicenseCredential_application_licenseNo_idx"
  ON "CustomerLicenseCredential"("application", "licenseNo");

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerLicenseSession_tokenHash_key"
  ON "CustomerLicenseSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "CustomerLicenseSession_credentialId_expiresAt_idx"
  ON "CustomerLicenseSession"("credentialId", "expiresAt");
CREATE INDEX IF NOT EXISTS "CustomerLicenseSession_expiresAt_idx"
  ON "CustomerLicenseSession"("expiresAt");

ALTER TABLE "CustomerLicenseCredential"
  ADD CONSTRAINT "CustomerLicenseCredential_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerLicenseSession"
  ADD CONSTRAINT "CustomerLicenseSession_credentialId_fkey"
  FOREIGN KEY ("credentialId") REFERENCES "CustomerLicenseCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;
