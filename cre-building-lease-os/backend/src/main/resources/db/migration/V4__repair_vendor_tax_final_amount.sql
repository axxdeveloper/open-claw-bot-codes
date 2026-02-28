ALTER TABLE repair_records
  ADD COLUMN vendor_tax_id TEXT,
  ADD COLUMN final_amount NUMERIC(12,2);
