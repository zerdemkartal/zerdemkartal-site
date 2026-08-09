-- EFT onayinda e-postalanan tek kullanimlik gecici parolanin durumunu ve son
-- kullanma zamanini tutar. Parolanin kendisi degil, yalniz bcrypt ozeti saklanir.
ALTER TABLE "CustomerLicenseCredential"
  ADD COLUMN IF NOT EXISTS "passwordTemporary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "temporaryPasswordExpiresAt" TIMESTAMP(3);
