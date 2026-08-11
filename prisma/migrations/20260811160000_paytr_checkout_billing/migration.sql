ALTER TABLE "PaytrCheckout"
  ADD COLUMN "phone" VARCHAR(24),
  ADD COLUMN "invoiceType" VARCHAR(16),
  ADD COLUMN "companyTitle" VARCHAR(200),
  ADD COLUMN "taxNumber" VARCHAR(11),
  ADD COLUMN "taxOffice" VARCHAR(120),
  ADD COLUMN "billingAddress" VARCHAR(500),
  ADD COLUMN "billingDistrict" VARCHAR(120),
  ADD COLUMN "billingCity" VARCHAR(120);

ALTER TABLE "PaytrCheckout"
  ADD CONSTRAINT "PaytrCheckout_invoice_type_check"
    CHECK ("invoiceType" IS NULL OR "invoiceType" IN ('individual', 'corporate')),
  ADD CONSTRAINT "PaytrCheckout_invoice_fields_check"
    CHECK (
      "invoiceType" IS NULL OR (
        "phone" IS NOT NULL AND
        "taxNumber" IS NOT NULL AND
        "billingAddress" IS NOT NULL AND
        "billingDistrict" IS NOT NULL AND
        "billingCity" IS NOT NULL AND
        (
          ("invoiceType" = 'individual' AND "taxNumber" ~ '^[1-9][0-9]{10}$') OR
          ("invoiceType" = 'corporate' AND "taxNumber" ~ '^[0-9]{10}$' AND "companyTitle" IS NOT NULL AND "taxOffice" IS NOT NULL)
        )
      )
    );
