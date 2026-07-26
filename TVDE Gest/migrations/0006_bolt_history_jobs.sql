CREATE TABLE IF NOT EXISTS bolt_history_jobs (
  id TEXT PRIMARY KEY,
  company_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  next_start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  chunk_days INTEGER NOT NULL DEFAULT 7,
  completed_chunks INTEGER NOT NULL DEFAULT 0,
  total_chunks INTEGER NOT NULL DEFAULT 0,
  records_received INTEGER NOT NULL DEFAULT 0,
  records_created INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bolt_history_jobs_status ON bolt_history_jobs(status, updated_at);

CREATE TABLE IF NOT EXISTS historical_imports (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_name TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  granularity TEXT NOT NULL DEFAULT 'aggregated_period',
  imported_rows INTEGER NOT NULL DEFAULT 0,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historical_imports_period ON historical_imports(platform, period_start, period_end);
