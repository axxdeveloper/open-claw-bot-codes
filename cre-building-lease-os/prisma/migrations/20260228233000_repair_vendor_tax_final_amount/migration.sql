ALTER TABLE "public"."RepairRecord"
  ADD COLUMN "vendorTaxId" TEXT,
  ADD COLUMN "finalAmount" DECIMAL(12,2);
