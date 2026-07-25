PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS privacy_consents (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Uber','Bolt','General')),
  consent_type TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  granted INTEGER NOT NULL DEFAULT 0,
  granted_at TEXT,
  revoked_at TEXT,
  evidence_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  UNIQUE(driver_id, platform, consent_type, policy_version)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  platform TEXT,
  ip_hash TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id TEXT PRIMARY KEY,
  driver_id TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('Uber','Bolt','All')),
  requested_by TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  details_json TEXT,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  event_type TEXT,
  event_time INTEGER,
  environment TEXT,
  signature_valid INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT,
  processed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (key, value)
VALUES ('privacy_policy_version', '2026-07-25')
ON CONFLICT(key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('uber_combined_processing_authorized', 'false')
ON CONFLICT(key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('uber_retention_days', '90')
ON CONFLICT(key) DO NOTHING;

UPDATE settlement_rules SET include_uber = 0 WHERE active = 0;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consents_driver ON privacy_consents(driver_id, platform);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON data_deletion_requests(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_platform_time ON webhook_events(platform, created_at DESC);
