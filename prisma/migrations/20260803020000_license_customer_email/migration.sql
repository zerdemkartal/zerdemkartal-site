ALTER TABLE "License" ADD COLUMN "customerEmail" TEXT;

CREATE INDEX "License_customerEmail_idx" ON "License"("customerEmail");
