import { uid } from './db.js';

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function previousMonday(reference = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(reference);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dateIso = `${map.year}-${map.month}-${map.day}`;
  const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDay = weekdays[map.weekday];
  const daysSinceMonday = (currentDay + 6) % 7;
  const thisMonday = addDays(dateIso, -daysSinceMonday);
  return addDays(thisMonday, -7);
}

async function ensureDefaultRule(db, driverId) {
  await db.prepare(`
    INSERT INTO settlement_rules (driver_id, active, mode, weekly_rent_cents, driver_share_basis_points, operator_fee_cents)
    VALUES (?, 0, 'RENT_ONLY', 25000, 10000, 0)
    ON CONFLICT(driver_id) DO NOTHING
  `).bind(driverId).run();
  return db.prepare('SELECT * FROM settlement_rules WHERE driver_id = ?').bind(driverId).first();
}

function applyPayments(baseBalance, payments) {
  if (baseBalance > 0) return Math.max(0, baseBalance - payments);
  if (baseBalance < 0) return Math.min(0, baseBalance + payments);
  return 0;
}

function direction(balance) {
  if (balance > 0) return 'TO_DRIVER';
  if (balance < 0) return 'TO_COMPANY';
  return 'SETTLED';
}

export async function upsertSettlementRule(db, input) {
  const allowed = ['RENT_ONLY', 'FLEET_PAYOUT', 'PERCENTAGE'];
  if (!input.driverId) throw new Error('driverId é obrigatório.');
  if (!allowed.includes(input.mode)) throw new Error('Modo de acerto inválido.');
  const rent = Math.max(0, Math.round(Number(input.weeklyRentCents || 0)));
  const share = Math.min(10000, Math.max(0, Math.round(Number(input.driverShareBasisPoints ?? 10000))));
  const fee = Math.max(0, Math.round(Number(input.operatorFeeCents || 0)));
  await db.prepare(`
    INSERT INTO settlement_rules (
      driver_id, active, mode, weekly_rent_cents, driver_share_basis_points, operator_fee_cents,
      include_bolt, include_uber, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(driver_id) DO UPDATE SET
      active = excluded.active,
      mode = excluded.mode,
      weekly_rent_cents = excluded.weekly_rent_cents,
      driver_share_basis_points = excluded.driver_share_basis_points,
      operator_fee_cents = excluded.operator_fee_cents,
      include_bolt = excluded.include_bolt,
      include_uber = excluded.include_uber,
      notes = excluded.notes,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    input.driverId, input.active === true ? 1 : 0, input.mode, rent, share, fee,
    input.includeBolt === false ? 0 : 1,
    input.includeUber === true ? 1 : 0,
    input.notes || null,
  ).run();
  return db.prepare('SELECT * FROM settlement_rules WHERE driver_id = ?').bind(input.driverId).first();
}

export async function addSettlementAdjustment(db, input) {
  if (!input.driverId || !input.weekStart || !['credit', 'debit', 'payment'].includes(input.type)) {
    throw new Error('Ajuste semanal inválido.');
  }
  const amount = Math.max(0, Math.round(Number(input.amountCents || 0)));
  const id = uid('adj_');
  await db.prepare(`
    INSERT INTO settlement_adjustments (id, driver_id, week_start, type, amount_cents, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, input.driverId, input.weekStart, input.type, amount, input.description || null).run();
  return { id };
}

export async function calculateSettlements(db, weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const driversResult = await db.prepare('SELECT id, name FROM drivers ORDER BY name').all();
  const results = [];

  for (const driver of driversResult.results || []) {
    const rule = await ensureDefaultRule(db, driver.id);
    if (Number(rule.active || 0) !== 1) continue;

    const totals = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN platform = 'Bolt' AND ? = 1 THEN net_cents ELSE 0 END), 0) AS bolt_net,
        COALESCE(SUM(CASE WHEN platform = 'Uber' AND ? = 1 THEN net_cents ELSE 0 END), 0) AS uber_net,
        COALESCE(SUM(CASE WHEN platform IN ('Bolt','Uber') THEN trip_count ELSE 0 END), 0) AS trips
      FROM financial_entries
      WHERE driver_id = ? AND service_date BETWEEN ? AND ?
    `).bind(rule.include_bolt, rule.include_uber, driver.id, weekStart, weekEnd).first();

    const adjustments = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_cents ELSE 0 END), 0) AS credits,
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount_cents ELSE 0 END), 0) AS debits,
        COALESCE(SUM(CASE WHEN type = 'payment' THEN amount_cents ELSE 0 END), 0) AS payments
      FROM settlement_adjustments WHERE driver_id = ? AND week_start = ?
    `).bind(driver.id, weekStart).first();

    const boltNet = Number(totals.bolt_net || 0);
    const uberNet = Number(totals.uber_net || 0);
    const platformNet = boltNet + uberNet;
    const rent = Number(rule.weekly_rent_cents || 0);
    const fee = Number(rule.operator_fee_cents || 0);
    const credits = Number(adjustments.credits || 0);
    const debits = Number(adjustments.debits || 0);
    const payments = Number(adjustments.payments || 0);
    let percentageDeduction = 0;
    let baseBalance = 0;

    if (rule.mode === 'RENT_ONLY') {
      baseBalance = -rent - fee + credits - debits;
    } else if (rule.mode === 'FLEET_PAYOUT') {
      baseBalance = platformNet - rent - fee + credits - debits;
    } else {
      const driverShare = Math.round(platformNet * Number(rule.driver_share_basis_points || 0) / 10000);
      percentageDeduction = platformNet - driverShare;
      baseBalance = driverShare - rent - fee + credits - debits;
    }

    const balance = applyPayments(baseBalance, payments);
    const calculation = {
      formula: rule.mode,
      tripCount: Number(totals.trips || 0),
      baseBalanceCents: baseBalance,
      paymentApplication: baseBalance >= 0 ? 'company_to_driver' : 'driver_to_company',
    };
    const existing = await db.prepare(
      'SELECT id, status FROM weekly_settlements WHERE driver_id = ? AND week_start = ?'
    ).bind(driver.id, weekStart).first();
    const id = existing?.id || uid('set_');
    await db.prepare(`
      INSERT INTO weekly_settlements (
        id, driver_id, week_start, week_end, mode, bolt_net_cents, uber_net_cents,
        platform_net_cents, weekly_rent_cents, percentage_deduction_cents,
        operator_fee_cents, credits_cents, debits_cents, payments_cents,
        balance_cents, balance_direction, status, calculation_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(driver_id, week_start) DO UPDATE SET
        week_end = excluded.week_end,
        mode = excluded.mode,
        bolt_net_cents = excluded.bolt_net_cents,
        uber_net_cents = excluded.uber_net_cents,
        platform_net_cents = excluded.platform_net_cents,
        weekly_rent_cents = excluded.weekly_rent_cents,
        percentage_deduction_cents = excluded.percentage_deduction_cents,
        operator_fee_cents = excluded.operator_fee_cents,
        credits_cents = excluded.credits_cents,
        debits_cents = excluded.debits_cents,
        payments_cents = excluded.payments_cents,
        balance_cents = excluded.balance_cents,
        balance_direction = excluded.balance_direction,
        calculation_json = excluded.calculation_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      id, driver.id, weekStart, weekEnd, rule.mode, boltNet, uberNet, platformNet,
      rent, percentageDeduction, fee, credits, debits, payments, balance,
      direction(balance), existing?.status || 'draft', JSON.stringify(calculation),
    ).run();
    results.push({ driverId: driver.id, driverName: driver.name, weekStart, weekEnd, balance, direction: direction(balance) });
  }
  return results;
}

export async function listSettlements(db, weekStart) {
  const result = await db.prepare(`
    SELECT s.*, d.name AS driver_name, d.phone AS driver_phone,
      r.driver_share_basis_points, r.notes AS rule_notes
    FROM weekly_settlements s
    JOIN drivers d ON d.id = s.driver_id
    LEFT JOIN settlement_rules r ON r.driver_id = s.driver_id
    WHERE s.week_start = ?
    ORDER BY d.name
  `).bind(weekStart).all();
  return result.results || [];
}

export async function listSettlementRules(db) {
  const result = await db.prepare(`
    SELECT d.id AS driver_id, d.name AS driver_name,
      COALESCE(r.active, 0) AS active,
      COALESCE(r.mode, 'RENT_ONLY') AS mode,
      COALESCE(r.weekly_rent_cents, 25000) AS weekly_rent_cents,
      COALESCE(r.driver_share_basis_points, 10000) AS driver_share_basis_points,
      COALESCE(r.operator_fee_cents, 0) AS operator_fee_cents,
      COALESCE(r.include_bolt, 1) AS include_bolt,
      COALESCE(r.include_uber, 0) AS include_uber,
      r.notes
    FROM drivers d LEFT JOIN settlement_rules r ON r.driver_id = d.id
    ORDER BY d.name
  `).all();
  return result.results || [];
}
