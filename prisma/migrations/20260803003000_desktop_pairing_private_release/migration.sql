CREATE TABLE "DesktopPairing" (
  "id" TEXT NOT NULL,
  "secretHash" CHAR(64) NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "claimedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DesktopPairing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReleaseArtifact" (
  "id" TEXT NOT NULL,
  "application" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "blobPath" TEXT NOT NULL,
  "sha512" TEXT NOT NULL,
  "size" BIGINT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReleaseArtifact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DesktopPairing_secretHash_key" ON "DesktopPairing"("secretHash");
CREATE INDEX "DesktopPairing_expiresAt_idx" ON "DesktopPairing"("expiresAt");
CREATE INDEX "DesktopPairing_approvedById_approvedAt_idx" ON "DesktopPairing"("approvedById", "approvedAt");
CREATE UNIQUE INDEX "ReleaseArtifact_blobPath_key" ON "ReleaseArtifact"("blobPath");
CREATE UNIQUE INDEX "ReleaseArtifact_application_platform_version_key" ON "ReleaseArtifact"("application", "platform", "version");
CREATE INDEX "ReleaseArtifact_application_platform_active_publishedAt_idx" ON "ReleaseArtifact"("application", "platform", "active", "publishedAt");

ALTER TABLE "DesktopPairing"
  ADD CONSTRAINT "DesktopPairing_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
