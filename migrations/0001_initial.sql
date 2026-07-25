PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  tvde_license TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_vehicle_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_platform_accounts (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Bolt','Uber')),
  external_driver_id TEXT,
  external_partner_id TEXT,
  organization_id TEXT,
  platform_status TEXT,
  rating REAL,
  score REAL,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  UNIQUE(platform, external_driver_id)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  license_plate TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  color TEXT,
  seats INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  current_driver_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(license_plate)
);

CREATE TABLE IF NOT EXISTS vehicle_platform_accounts (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Bolt','Uber')),
  external_vehicle_id TEXT,
  external_vehicle_id_encrypted TEXT,
  organization_id TEXT,
  platform_status TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  UNIQUE(platform, external_vehicle_id)
);

CREATE TABLE IF NOT EXISTS financial_entries (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('Bolt','Uber','Manual')),
  external_id TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'trip',
  driver_id TEXT,
  vehicle_id TEXT,
  occurred_at TEXT NOT NULL,
  service_date TEXT NOT NULL,
  status TEXT,
  trip_count INTEGER NOT NULL DEFAULT 0,
  hours_online REAL NOT NULL DEFAULT 0,
  hours_on_trip REAL NOT NULL DEFAULT 0,
  gross_cents INTEGER NOT NULL DEFAULT 0,
  net_cents INTEGER NOT NULL DEFAULT 0,
  commission_cents INTEGER NOT NULL DEFAULT 0,
  tip_cents INTEGER NOT NULL DEFAULT 0,
  toll_cents INTEGER NOT NULL DEFAULT 0,
  cash_collected_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  distance_km REAL NOT NULL DEFAULT 0,
  description TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  UNIQUE(platform, external_id)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  records_received INTEGER NOT NULL DEFAULT 0,
  records_created INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  details_json TEXT
);

CREATE TABLE IF NOT EXISTS settlement_rules (
  driver_id TEXT PRIMARY KEY,
  active INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'RENT_ONLY' CHECK (mode IN ('RENT_ONLY','FLEET_PAYOUT','PERCENTAGE')),
  weekly_rent_cents INTEGER NOT NULL DEFAULT 25000,
  driver_share_basis_points INTEGER NOT NULL DEFAULT 10000,
  operator_fee_cents INTEGER NOT NULL DEFAULT 0,
  include_bolt INTEGER NOT NULL DEFAULT 1,
  include_uber INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settlement_adjustments (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit','debit','payment')),
  amount_cents INTEGER NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_settlements (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  mode TEXT NOT NULL,
  bolt_net_cents INTEGER NOT NULL DEFAULT 0,
  uber_net_cents INTEGER NOT NULL DEFAULT 0,
  platform_net_cents INTEGER NOT NULL DEFAULT 0,
  weekly_rent_cents INTEGER NOT NULL DEFAULT 0,
  percentage_deduction_cents INTEGER NOT NULL DEFAULT 0,
  operator_fee_cents INTEGER NOT NULL DEFAULT 0,
  credits_cents INTEGER NOT NULL DEFAULT 0,
  debits_cents INTEGER NOT NULL DEFAULT 0,
  payments_cents INTEGER NOT NULL DEFAULT 0,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  balance_direction TEXT NOT NULL CHECK (balance_direction IN ('TO_DRIVER','TO_COMPANY','SETTLED')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','paid','cancelled')),
  calculation_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  UNIQUE(driver_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_service_date ON financial_entries(service_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_driver_date ON financial_entries(driver_id, service_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_platform_date ON financial_entries(platform, service_date);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started_at ON sync_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_adjustments_driver_week ON settlement_adjustments(driver_id, week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_settlements_week ON weekly_settlements(week_start);
