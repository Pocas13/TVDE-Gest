PRAGMA foreign_keys = ON;
UPDATE drivers SET status='inactive',updated_at=CURRENT_TIMESTAMP WHERE lower(name) IN ('anúbis ribeiro','anubis ribeiro');
UPDATE driver_platform_accounts SET platform_status='inactive',updated_at=CURRENT_TIMESTAMP WHERE driver_id IN (SELECT id FROM drivers WHERE lower(name) IN ('anúbis ribeiro','anubis ribeiro'));
DELETE FROM settlement_rules WHERE driver_id IN (SELECT id FROM drivers WHERE lower(name) IN ('anúbis ribeiro','anubis ribeiro'));
DELETE FROM weekly_settlements WHERE driver_id IN (SELECT id FROM drivers WHERE lower(name) IN ('anúbis ribeiro','anubis ribeiro')) AND status='draft';
INSERT INTO app_settings(key,value,updated_at) VALUES('settlement_reports_version','0011',CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value='0011',updated_at=CURRENT_TIMESTAMP;
