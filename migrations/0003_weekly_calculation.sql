ALTER TABLE settlement_rules ADD COLUMN vat_rate_basis_points INTEGER NOT NULL DEFAULT 600;
ALTER TABLE settlement_rules ADD COLUMN operator_commission_basis_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE settlement_rules ADD COLUMN charge_type TEXT NOT NULL DEFAULT 'VEHICLE_RENTAL';

CREATE TABLE IF NOT EXISTS settlement_week_overrides (
  driver_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  weekly_charge_cents INTEGER,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (driver_id, week_start),
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

ALTER TABLE weekly_settlements ADD COLUMN fare_gross_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE weekly_settlements ADD COLUMN tips_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE weekly_settlements ADD COLUMN tolls_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE weekly_settlements ADD COLUMN vat_withheld_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE weekly_settlements ADD COLUMN operator_commission_calculated_cents INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_settlement_week_overrides_week ON settlement_week_overrides(week_start);
