ALTER TABLE financial_entries ADD COLUMN campaign_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE financial_entries ADD COLUMN reimbursement_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE financial_entries ADD COLUMN cancellation_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE financial_entries ADD COLUMN booking_fee_cents INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_financial_entries_platform_driver_date ON financial_entries(platform, driver_id, service_date);
