ALTER TABLE "PaytrCheckout"
  DROP CONSTRAINT IF EXISTS "PaytrCheckout_invoice_fields_check",
  DROP CONSTRAINT IF EXISTS "PaytrCheckout_invoice_type_check";

ALTER TABLE "PaytrCheckout"
  DROP COLUMN IF EXISTS "billingCity",
  DROP COLUMN IF EXISTS "billingDistrict",
  DROP COLUMN IF EXISTS "billingAddress",
  DROP COLUMN IF EXISTS "taxOffice",
  DROP COLUMN IF EXISTS "taxNumber",
  DROP COLUMN IF EXISTS "companyTitle",
  DROP COLUMN IF EXISTS "invoiceType",
  DROP COLUMN IF EXISTS "phone";
