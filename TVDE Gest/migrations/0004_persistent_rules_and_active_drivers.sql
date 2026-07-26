-- Regras são permanentes por motorista; o IVA é uma regra fixa de 6% incluído.
UPDATE settlement_rules SET active=1, vat_rate_basis_points=600, updated_at=CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_driver_platform_status ON driver_platform_accounts(platform, platform_status);
