ALTER TABLE "CustomerLicenseCredential"
  DROP COLUMN IF EXISTS "temporaryPasswordExpiresAt",
  DROP COLUMN IF EXISTS "passwordTemporary";
