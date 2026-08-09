DROP TABLE IF EXISTS "CustomerLicenseSession";
DROP TABLE IF EXISTS "CustomerLicenseCredential";
ALTER TABLE "Order"
  DROP COLUMN IF EXISTS "paymentEmailSentAt",
  DROP COLUMN IF EXISTS "paidAt";
