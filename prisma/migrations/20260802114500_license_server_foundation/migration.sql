-- Hermes lisans sunucusu Faz A: yalnız şema. Bu migration canlıya bu turda uygulanmaz.
ALTER TABLE "AdminUser"
  ADD COLUMN "licenseRole" TEXT,
  ADD COLUMN "licenseActive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "licenseMfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "licenseMfaSecretCipher" TEXT,
  ADD COLUMN "licenseMfaPendingCipher" TEXT,
  ADD COLUMN "licenseMfaPendingExpiresAt" TIMESTAMP(3),
  ADD COLUMN "licenseMfaLastCounter" BIGINT,
  ADD COLUMN "licenseMfaRecoveryHashes" JSONB,
  ADD COLUMN "licenseFailedAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "licenseLockedUntil" TIMESTAMP(3),
  ADD COLUMN "licenseLastLoginAt" TIMESTAMP(3),
  ADD COLUMN "licenseAuthVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "licenseRoleChangedAt" TIMESTAMP(3);

CREATE TABLE "LicenseImport" (
  "id" TEXT NOT NULL,
  "sourceHash" CHAR(64) NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'dry-run',
  "status" TEXT NOT NULL DEFAULT 'hazirlandi',
  "summary" JSONB NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "committedAt" TIMESTAMP(3),
  CONSTRAINT "LicenseImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "License" (
  "id" TEXT NOT NULL,
  "licenseNo" TEXT NOT NULL,
  "fingerprint" CHAR(64) NOT NULL,
  "application" TEXT NOT NULL,
  "customerRef" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'aktif',
  "statusReason" TEXT,
  "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "suspendedUntil" TIMESTAMP(3),
  "signedLevel" TEXT NOT NULL,
  "signedFeatures" JSONB NOT NULL,
  "remoteLevel" TEXT NOT NULL,
  "remoteFeatures" JSONB NOT NULL,
  "authorizationVersion" INTEGER NOT NULL DEFAULT 1,
  "deviceLimit" INTEGER NOT NULL DEFAULT 1,
  "monitoringOnly" BOOLEAN NOT NULL DEFAULT true,
  "permanentlyRevokedAt" TIMESTAMP(3),
  "sourceImportId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "License_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "License_application_check" CHECK ("application" IN ('hermes', 'astropen')),
  CONSTRAINT "License_status_check" CHECK ("status" IN ('aktif', 'askida', 'iptal', 'suresi_doldu', 'cihaz_transferi', 'bakim')),
  CONSTRAINT "License_fingerprint_check" CHECK ("fingerprint" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "License_deviceLimit_check" CHECK ("deviceLimit" >= 1),
  CONSTRAINT "License_authorizationVersion_check" CHECK ("authorizationVersion" >= 1),
  CONSTRAINT "License_signedFeatures_check" CHECK (jsonb_typeof("signedFeatures") = 'array'),
  CONSTRAINT "License_remoteFeatures_check" CHECK (jsonb_typeof("remoteFeatures") = 'array'),
  CONSTRAINT "License_permanent_revoke_check" CHECK ("status" <> 'iptal' OR "permanentlyRevokedAt" IS NOT NULL)
);

CREATE TABLE "LicenseAlias" (
  "id" TEXT NOT NULL,
  "licenseId" TEXT NOT NULL,
  "licenseNo" TEXT NOT NULL,
  "sourceRow" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LicenseAlias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LicenseDevice" (
  "id" TEXT NOT NULL,
  "licenseId" TEXT NOT NULL,
  "deviceHash" CHAR(64) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastVerifiedAt" TIMESTAMP(3),
  "lastAppVersion" TEXT,
  "releasedAt" TIMESTAMP(3),
  CONSTRAINT "LicenseDevice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LicenseDevice_hash_check" CHECK ("deviceHash" ~ '^[0-9a-f]{64}$')
);

CREATE TABLE "LicenseLease" (
  "id" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "rights" JSONB NOT NULL,
  "serverTime" TIMESTAMP(3) NOT NULL,
  "nextCheckAt" TIMESTAMP(3) NOT NULL,
  "graceUntil" TIMESTAMP(3) NOT NULL,
  "nonceHash" CHAR(64) NOT NULL,
  "responseHash" CHAR(64) NOT NULL,
  "keyVersion" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LicenseLease_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LicenseLease_nonceHash_check" CHECK ("nonceHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "LicenseLease_responseHash_check" CHECK ("responseHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "LicenseLease_time_check" CHECK ("serverTime" <= "nextCheckAt" AND "nextCheckAt" <= "graceUntil"),
  CONSTRAINT "LicenseLease_keyVersion_check" CHECK ("keyVersion" >= 1)
);

CREATE TABLE "LicenseNonce" (
  "id" TEXT NOT NULL,
  "licenseId" TEXT NOT NULL,
  "nonceHash" CHAR(64) NOT NULL,
  "deviceHash" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LicenseNonce_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LicenseNonce_nonceHash_check" CHECK ("nonceHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "LicenseNonce_deviceHash_check" CHECK ("deviceHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "LicenseNonce_expiry_check" CHECK ("createdAt" < "expiresAt")
);

CREATE TABLE "LicenseEvent" (
  "id" TEXT NOT NULL,
  "licenseId" TEXT,
  "actorId" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "reason" TEXT,
  "beforeState" JSONB,
  "afterState" JSONB,
  "requestId" TEXT NOT NULL,
  "previousHash" CHAR(64),
  "eventHash" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LicenseEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LicenseEvent_previousHash_check" CHECK ("previousHash" IS NULL OR "previousHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "LicenseEvent_eventHash_check" CHECK ("eventHash" ~ '^[0-9a-f]{64}$')
);

CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "authVersion" INTEGER NOT NULL,
  "mfaVerifiedAt" TIMESTAMP(3),
  "reauthenticatedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminSession_tokenHash_check" CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "AdminSession_authVersion_check" CHECK ("authVersion" >= 1),
  CONSTRAINT "AdminSession_expiry_check" CHECK ("createdAt" < "expiresAt")
);

CREATE UNIQUE INDEX "LicenseImport_sourceHash_key" ON "LicenseImport"("sourceHash");
CREATE INDEX "LicenseImport_createdById_createdAt_idx" ON "LicenseImport"("createdById", "createdAt");
CREATE UNIQUE INDEX "License_licenseNo_key" ON "License"("licenseNo");
CREATE UNIQUE INDEX "License_fingerprint_key" ON "License"("fingerprint");
CREATE INDEX "License_application_status_idx" ON "License"("application", "status");
CREATE INDEX "License_sourceImportId_idx" ON "License"("sourceImportId");
CREATE UNIQUE INDEX "LicenseAlias_licenseNo_key" ON "LicenseAlias"("licenseNo");
CREATE INDEX "LicenseAlias_licenseId_idx" ON "LicenseAlias"("licenseId");
CREATE UNIQUE INDEX "LicenseDevice_licenseId_deviceHash_key" ON "LicenseDevice"("licenseId", "deviceHash");
CREATE INDEX "LicenseDevice_licenseId_active_idx" ON "LicenseDevice"("licenseId", "active");
CREATE UNIQUE INDEX "LicenseLease_deviceId_key" ON "LicenseLease"("deviceId");
CREATE UNIQUE INDEX "LicenseLease_nonceHash_key" ON "LicenseLease"("nonceHash");
CREATE UNIQUE INDEX "LicenseNonce_nonceHash_key" ON "LicenseNonce"("nonceHash");
CREATE INDEX "LicenseNonce_expiresAt_idx" ON "LicenseNonce"("expiresAt");
CREATE INDEX "LicenseNonce_licenseId_deviceHash_idx" ON "LicenseNonce"("licenseId", "deviceHash");
CREATE UNIQUE INDEX "LicenseEvent_requestId_key" ON "LicenseEvent"("requestId");
CREATE UNIQUE INDEX "LicenseEvent_eventHash_key" ON "LicenseEvent"("eventHash");
CREATE INDEX "LicenseEvent_licenseId_createdAt_idx" ON "LicenseEvent"("licenseId", "createdAt");
CREATE INDEX "LicenseEvent_actorId_createdAt_idx" ON "LicenseEvent"("actorId", "createdAt");
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX "AdminSession_adminId_expiresAt_idx" ON "AdminSession"("adminId", "expiresAt");

ALTER TABLE "LicenseImport" ADD CONSTRAINT "LicenseImport_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "License" ADD CONSTRAINT "License_sourceImportId_fkey"
  FOREIGN KEY ("sourceImportId") REFERENCES "LicenseImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LicenseAlias" ADD CONSTRAINT "LicenseAlias_licenseId_fkey"
  FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LicenseDevice" ADD CONSTRAINT "LicenseDevice_licenseId_fkey"
  FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LicenseLease" ADD CONSTRAINT "LicenseLease_deviceId_fkey"
  FOREIGN KEY ("deviceId") REFERENCES "LicenseDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LicenseNonce" ADD CONSTRAINT "LicenseNonce_licenseId_fkey"
  FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LicenseEvent" ADD CONSTRAINT "LicenseEvent_licenseId_fkey"
  FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LicenseEvent" ADD CONSTRAINT "LicenseEvent_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_licenseRole_check"
  CHECK ("licenseRole" IS NULL OR "licenseRole" IN ('sahip', 'lisans_yoneticisi', 'destek', 'denetci'));
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_licenseAuthVersion_check"
  CHECK ("licenseAuthVersion" >= 1);
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_licenseFailedAttempts_check"
  CHECK ("licenseFailedAttempts" >= 0);

CREATE OR REPLACE FUNCTION license_event_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'LicenseEvent append-only tablosudur';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "LicenseEvent_append_only_update"
  BEFORE UPDATE ON "LicenseEvent" FOR EACH ROW EXECUTE FUNCTION license_event_append_only();
CREATE TRIGGER "LicenseEvent_append_only_delete"
  BEFORE DELETE ON "LicenseEvent" FOR EACH ROW EXECUTE FUNCTION license_event_append_only();
