-- Siparişten bağımsız da üretilebilen, 72 saatlik şifreli indirme davetleri.
-- Bağlantı ve oturum belirteçleri SHA-256, parola bcrypt özeti olarak tutulur.
CREATE TABLE "DownloadInvite" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "application" TEXT NOT NULL DEFAULT 'hermes',
  "linkTokenHash" CHAR(64) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "passwordExpiresAt" TIMESTAMP(3) NOT NULL,
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdByRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DownloadInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DownloadSession" (
  "id" TEXT NOT NULL,
  "inviteId" TEXT NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DownloadSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DownloadInvite_linkTokenHash_key" ON "DownloadInvite"("linkTokenHash");
CREATE INDEX "DownloadInvite_email_createdAt_idx" ON "DownloadInvite"("email", "createdAt");
CREATE INDEX "DownloadInvite_orderId_createdAt_idx" ON "DownloadInvite"("orderId", "createdAt");
CREATE INDEX "DownloadInvite_application_revokedAt_passwordExpiresAt_idx" ON "DownloadInvite"("application", "revokedAt", "passwordExpiresAt");
CREATE UNIQUE INDEX "DownloadSession_tokenHash_key" ON "DownloadSession"("tokenHash");
CREATE INDEX "DownloadSession_inviteId_expiresAt_idx" ON "DownloadSession"("inviteId", "expiresAt");
CREATE INDEX "DownloadSession_expiresAt_idx" ON "DownloadSession"("expiresAt");

ALTER TABLE "DownloadInvite"
  ADD CONSTRAINT "DownloadInvite_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DownloadSession"
  ADD CONSTRAINT "DownloadSession_inviteId_fkey"
  FOREIGN KEY ("inviteId") REFERENCES "DownloadInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DownloadInvite"
  ADD CONSTRAINT "DownloadInvite_failedAttempts_check"
  CHECK ("failedAttempts" >= 0 AND "failedAttempts" <= 5);
