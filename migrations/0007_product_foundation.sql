PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  timezone TEXT NOT NULL DEFAULT 'Europe/Lisbon',
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS driver_portal_tokens (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  import_type TEXT NOT NULL,
  source_name TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  rows_received INTEGER NOT NULL DEFAULT 0,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_updated INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aggregate_driver_periods (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Bolt','Uber','Manual')),
  driver_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  source_name TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  granularity TEXT NOT NULL DEFAULT 'aggregated_period',
  gross_cents INTEGER NOT NULL DEFAULT 0,
  net_cents INTEGER NOT NULL DEFAULT 0,
  commission_cents INTEGER NOT NULL DEFAULT 0,
  tips_cents INTEGER NOT NULL DEFAULT 0,
  tolls_cents INTEGER NOT NULL DEFAULT 0,
  campaign_cents INTEGER NOT NULL DEFAULT 0,
  reimbursement_cents INTEGER NOT NULL DEFAULT 0,
  cancellation_cents INTEGER NOT NULL DEFAULT 0,
  booking_fee_cents INTEGER NOT NULL DEFAULT 0,
  trip_count INTEGER NOT NULL DEFAULT 0,
  hours_online REAL NOT NULL DEFAULT 0,
  hours_on_trip REAL NOT NULL DEFAULT 0,
  distance_km REAL NOT NULL DEFAULT 0,
  acceptance_rate REAL,
  utilization_rate REAL,
  completion_rate REAL,
  rating REAL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  UNIQUE(platform, external_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS activity_driver_periods (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Bolt','Uber','Manual')),
  driver_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  source_name TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  trip_count INTEGER NOT NULL DEFAULT 0,
  hours_online REAL NOT NULL DEFAULT 0,
  hours_on_trip REAL NOT NULL DEFAULT 0,
  distance_km REAL NOT NULL DEFAULT 0,
  acceptance_rate REAL,
  utilization_rate REAL,
  completion_rate REAL,
  rating REAL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  UNIQUE(platform, external_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS vehicle_costs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  cost_date TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  description TEXT,
  recurring INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS operational_alerts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE drivers ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'org_daniel_sc';
ALTER TABLE vehicles ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'org_daniel_sc';
ALTER TABLE financial_entries ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'org_daniel_sc';
ALTER TABLE weekly_settlements ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'org_daniel_sc';
ALTER TABLE settlement_rules ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'org_daniel_sc';
ALTER TABLE sync_runs ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'org_daniel_sc';
ALTER TABLE bolt_history_jobs ADD COLUMN next_retry_at TEXT;
ALTER TABLE bolt_history_jobs ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;

INSERT INTO organizations (id, name, legal_name, tax_id)
VALUES ('org_daniel_sc', 'Daniel SC', 'DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA', '517388944')
ON CONFLICT(id) DO UPDATE SET
  name=excluded.name, legal_name=excluded.legal_name, tax_id=excluded.tax_id, updated_at=CURRENT_TIMESTAMP;

INSERT INTO app_settings (key, value) VALUES ('default_organization_id', 'org_daniel_sc')
ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP;

INSERT INTO app_settings (key, value) VALUES ('bolt_aggregate_cutover_date', '2026-07-20')
ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP;

INSERT INTO app_settings (key, value) VALUES ('product_mode', 'saas_ready')
ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_aggregate_period_org_dates ON aggregate_driver_periods(organization_id, platform, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_activity_period_org_dates ON activity_driver_periods(organization_id, platform, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_driver ON driver_portal_tokens(driver_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_date ON vehicle_costs(vehicle_id, cost_date);
CREATE INDEX IF NOT EXISTS idx_operational_alerts_status ON operational_alerts(organization_id, status, detected_at DESC);
