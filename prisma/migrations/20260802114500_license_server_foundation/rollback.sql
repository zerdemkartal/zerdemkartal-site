-- Yalnız kontrollü geri dönüş için; çalıştırılmadan önce lisans tablolarının yedeği alınmalıdır.
DROP TRIGGER IF EXISTS "LicenseEvent_append_only_delete" ON "LicenseEvent";
DROP TRIGGER IF EXISTS "LicenseEvent_append_only_update" ON "LicenseEvent";
DROP FUNCTION IF EXISTS license_event_append_only();

DROP TABLE IF EXISTS "AdminSession";
DROP TABLE IF EXISTS "LicenseEvent";
DROP TABLE IF EXISTS "LicenseNonce";
DROP TABLE IF EXISTS "LicenseLease";
DROP TABLE IF EXISTS "LicenseDevice";
DROP TABLE IF EXISTS "LicenseAlias";
DROP TABLE IF EXISTS "License";
DROP TABLE IF EXISTS "LicenseImport";

ALTER TABLE "AdminUser"
  DROP CONSTRAINT IF EXISTS "AdminUser_licenseAuthVersion_check",
  DROP CONSTRAINT IF EXISTS "AdminUser_licenseRole_check",
  DROP COLUMN IF EXISTS "licenseRoleChangedAt",
  DROP COLUMN IF EXISTS "licenseAuthVersion",
  DROP COLUMN IF EXISTS "licenseLastLoginAt",
  DROP COLUMN IF EXISTS "licenseLockedUntil",
  DROP COLUMN IF EXISTS "licenseFailedAttempts",
  DROP COLUMN IF EXISTS "licenseMfaRecoveryHashes",
  DROP COLUMN IF EXISTS "licenseMfaLastCounter",
  DROP COLUMN IF EXISTS "licenseMfaPendingExpiresAt",
  DROP COLUMN IF EXISTS "licenseMfaPendingCipher",
  DROP COLUMN IF EXISTS "licenseMfaSecretCipher",
  DROP COLUMN IF EXISTS "licenseMfaEnabled",
  DROP COLUMN IF EXISTS "licenseActive",
  DROP COLUMN IF EXISTS "licenseRole";
