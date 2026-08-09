-- Lisans yönetimi: sahip Gmail kimliğini Google'ın değişmez subject değeriyle kilitle.
ALTER TABLE "AdminUser"
  ADD COLUMN IF NOT EXISTS "licenseGoogleSub" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_licenseGoogleSub_key"
  ON "AdminUser"("licenseGoogleSub");
