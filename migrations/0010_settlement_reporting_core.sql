PRAGMA foreign_keys = ON;
CREATE INDEX IF NOT EXISTS idx_aggregate_driver_periods_driver_period ON aggregate_driver_periods(driver_id,period_start,period_end);
CREATE INDEX IF NOT EXISTS idx_weekly_settlements_driver_week ON weekly_settlements(driver_id,week_start);
INSERT INTO app_settings(key,value,updated_at) VALUES('default_dashboard_period','this_week',CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value='this_week',updated_at=CURRENT_TIMESTAMP;
