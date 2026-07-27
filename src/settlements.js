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
  const daysSinceMonday = (weekdays[map.weekday] + 6) % 7;
  return addDays(addDays(dateIso, -daysSinceMonday), -7);
}

async function ensureDefaultRule(db, driverId) {
  await db.prepare(`
    INSERT INTO settlement_rules (
      driver_id, active, mode, weekly_rent_cents, driver_share_basis_points,
      operator_fee_cents, vat_rate_basis_points, operator_commission_basis_points, charge_type
    ) VALUES (?, 1, 'FLEET_PAYOUT', 25000, 10000, 0, 600, 0, 'VEHICLE_RENTAL')
    ON CONFLICT(driver_id) DO NOTHING
  `).bind(driverId).run();
  return db.prepare('SELECT * FROM settlement_rules WHERE driver_id = ?').bind(driverId).first();
}

function applyPayments(baseBalance, payments) {
  if (baseBalance > 0) return Math.max(0, baseBalance - payments);
  if (baseBalance < 0) return Math.min(0, baseBalance + payments);
  return 0;
}
function direction(balance) { return balance > 0 ? 'TO_DRIVER' : balance < 0 ? 'TO_COMPANY' : 'SETTLED'; }

export async function upsertSettlementRule(db, input) {
  if (!input.driverId) throw new Error('driverId é obrigatório.');
  const chargeTypes = ['SLOT', 'VEHICLE_RENTAL', 'PERCENTAGE'];
  const chargeType = chargeTypes.includes(input.chargeType) ? input.chargeType : 'VEHICLE_RENTAL';
  const rent = Math.max(0, Math.round(Number(input.weeklyRentCents || 0)));
  const vat = Math.min(10000, Math.max(0, Math.round(Number(input.vatRateBasisPoints ?? 600))));
  const commission = Math.min(10000, Math.max(0, Math.round(Number(input.operatorCommissionBasisPoints || 0))));
  await db.prepare(`
    INSERT INTO settlement_rules (
      driver_id, active, mode, weekly_rent_cents, driver_share_basis_points, operator_fee_cents,
      include_bolt, include_uber, notes, vat_rate_basis_points, operator_commission_basis_points,
      charge_type, updated_at
    ) VALUES (?, ?, 'FLEET_PAYOUT', ?, 10000, 0, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(driver_id) DO UPDATE SET
      active=excluded.active, mode='FLEET_PAYOUT', weekly_rent_cents=excluded.weekly_rent_cents,
      include_bolt=excluded.include_bolt, include_uber=excluded.include_uber, notes=excluded.notes,
      vat_rate_basis_points=excluded.vat_rate_basis_points,
      operator_commission_basis_points=excluded.operator_commission_basis_points,
      charge_type=excluded.charge_type, updated_at=CURRENT_TIMESTAMP
  `).bind(
    input.driverId, input.active === true ? 1 : 0, rent,
    input.includeBolt === false ? 0 : 1, input.includeUber === false ? 0 : 1,
    input.notes || null, vat, commission, chargeType,
  ).run();
  const saved = await db.prepare('SELECT * FROM settlement_rules WHERE driver_id = ?').bind(input.driverId).first();
  if (!saved) throw new Error('A regra não ficou guardada na base de dados.');
  return saved;
}

export async function upsertWeekOverride(db, input) {
  if (!input.driverId || !input.weekStart) throw new Error('Motorista e semana são obrigatórios.');
  const amount = input.weeklyChargeCents === null || input.weeklyChargeCents === ''
    ? null : Math.max(0, Math.round(Number(input.weeklyChargeCents)));
  await db.prepare(`
    INSERT INTO settlement_week_overrides (driver_id, week_start, weekly_charge_cents, notes, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(driver_id, week_start) DO UPDATE SET
      weekly_charge_cents=excluded.weekly_charge_cents, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP
  `).bind(input.driverId, input.weekStart, amount, input.notes || null).run();
  return { ok: true };
}

export async function addSettlementAdjustment(db, input) {
  if (!input.driverId || !input.weekStart || !['credit','debit','payment'].includes(input.type)) throw new Error('Ajuste semanal inválido.');
  const id = uid('adj_');
  await db.prepare(`INSERT INTO settlement_adjustments (id,driver_id,week_start,type,amount_cents,description) VALUES (?,?,?,?,?,?)`)
    .bind(id,input.driverId,input.weekStart,input.type,Math.max(0,Math.round(Number(input.amountCents||0))),input.description||null).run();
  return { id };
}

async function platformTotalsForWeek(db, driverId, platform, weekStart, weekEnd) {
  const aggregate = await db.prepare(`
    SELECT COUNT(*) rows_count,
      COALESCE(SUM(CASE WHEN platform='Bolt' THEN MAX(0,net_cents-tips_cents-tolls_cents) ELSE MAX(0,gross_cents-tips_cents-tolls_cents) END),0) fare,
      COALESCE(SUM(tips_cents),0) tips,
      COALESCE(SUM(tolls_cents),0) tolls,
      COALESCE(SUM(trip_count),0) trips
    FROM aggregate_driver_periods
    WHERE driver_id=? AND platform=? AND period_start<=? AND period_end>=?
  `).bind(driverId, platform, weekEnd, weekStart).first();
  if (Number(aggregate?.rows_count || 0) > 0) return aggregate;
  return db.prepare(`
    SELECT COUNT(*) rows_count,
      COALESCE(SUM(CASE WHEN platform='Bolt' THEN MAX(0,net_cents-tip_cents-toll_cents) ELSE MAX(0,gross_cents-tip_cents-toll_cents) END),0) fare,
      COALESCE(SUM(tip_cents),0) tips,
      COALESCE(SUM(toll_cents),0) tolls,
      COALESCE(SUM(trip_count),0) trips
    FROM financial_entries
    WHERE driver_id=? AND platform=? AND service_date BETWEEN ? AND ?
  `).bind(driverId, platform, weekStart, weekEnd).first();
}

export async function calculateSettlements(db, weekStart, options = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(weekStart || ''))) throw new Error('Semana inválida.');
  const weekEnd = addDays(weekStart, 6);
  const drivers = (await db.prepare(`
    SELECT DISTINCT d.id,d.name
    FROM drivers d JOIN driver_platform_accounts a ON a.driver_id=d.id
    WHERE LOWER(COALESCE(d.status,'active')) NOT IN ('inactive','disabled','deactivated','blocked')
      AND LOWER(COALESCE(a.platform_status,'active')) NOT IN ('inactive','disabled','deactivated','blocked','rejected')
    ORDER BY d.name
  `).all()).results || [];
  const results = [];
  for (const driver of drivers) {
    const rule = await ensureDefaultRule(db, driver.id);
    if (Number(rule.active || 0) !== 1) continue;
    const bolt = Number(rule.include_bolt) === 1 ? await platformTotalsForWeek(db, driver.id, 'Bolt', weekStart, weekEnd) : {};
    const uber = Number(rule.include_uber) === 1 ? await platformTotalsForWeek(db, driver.id, 'Uber', weekStart, weekEnd) : {};
    const boltFare=Number(bolt.fare||0), uberFare=Number(uber.fare||0);
    const boltTips=Number(bolt.tips||0), uberTips=Number(uber.tips||0);
    const boltTolls=Number(bolt.tolls||0), uberTolls=Number(uber.tolls||0);
    const trips=Number(bolt.trips||0)+Number(uber.trips||0);
    const adjs = await db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN type='credit' THEN amount_cents ELSE 0 END),0) credits,
      COALESCE(SUM(CASE WHEN type='debit' THEN amount_cents ELSE 0 END),0) debits,
      COALESCE(SUM(CASE WHEN type='payment' THEN amount_cents ELSE 0 END),0) payments
      FROM settlement_adjustments WHERE driver_id=? AND week_start=?`).bind(driver.id,weekStart).first();
    const override = await db.prepare('SELECT weekly_charge_cents FROM settlement_week_overrides WHERE driver_id=? AND week_start=?').bind(driver.id,weekStart).first();
    const fareGross=boltFare+uberFare, tips=boltTips+uberTips, tolls=boltTolls+uberTolls;
    const vatBp=Number(rule.vat_rate_basis_points ?? 600);
    const fareNetOfVat=Math.round(fareGross*10000/(10000+vatBp));
    const vatWithheld=fareGross-fareNetOfVat;
    const settlementBase=fareNetOfVat+tips+tolls;
    const commission=Math.round(settlementBase*Number(rule.operator_commission_basis_points||0)/10000);
    const weeklyCharge=override?.weekly_charge_cents==null?Number(rule.weekly_rent_cents||0):Number(override.weekly_charge_cents);
    const credits=Number(adjs.credits||0), debits=Number(adjs.debits||0), payments=Number(adjs.payments||0);
    const driverEntitlement=settlementBase-commission-weeklyCharge+credits-debits;
    const balance=applyPayments(driverEntitlement,payments);
    const existing=await db.prepare('SELECT id,status FROM weekly_settlements WHERE driver_id=? AND week_start=?').bind(driver.id,weekStart).first();
    const id=existing?.id||uid('set_');
    await db.prepare(`INSERT INTO weekly_settlements (
      id,driver_id,week_start,week_end,mode,bolt_net_cents,uber_net_cents,platform_net_cents,
      weekly_rent_cents,percentage_deduction_cents,operator_fee_cents,credits_cents,debits_cents,payments_cents,
      balance_cents,balance_direction,status,calculation_json,fare_gross_cents,tips_cents,tolls_cents,
      vat_withheld_cents,operator_commission_calculated_cents,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(driver_id,week_start) DO UPDATE SET
      week_end=excluded.week_end,mode=excluded.mode,bolt_net_cents=excluded.bolt_net_cents,uber_net_cents=excluded.uber_net_cents,
      platform_net_cents=excluded.platform_net_cents,weekly_rent_cents=excluded.weekly_rent_cents,
      percentage_deduction_cents=excluded.percentage_deduction_cents,credits_cents=excluded.credits_cents,
      debits_cents=excluded.debits_cents,payments_cents=excluded.payments_cents,balance_cents=excluded.balance_cents,
      balance_direction=excluded.balance_direction,calculation_json=excluded.calculation_json,
      fare_gross_cents=excluded.fare_gross_cents,tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,
      vat_withheld_cents=excluded.vat_withheld_cents,operator_commission_calculated_cents=excluded.operator_commission_calculated_cents,
      updated_at=CURRENT_TIMESTAMP`).bind(
      id,driver.id,weekStart,weekEnd,'TVDE_STANDARD',boltFare,uberFare,settlementBase,
      weeklyCharge,commission,0,credits,debits,payments,balance,direction(balance),existing?.status||'draft',
      JSON.stringify({formula:'(viagens/1.06)+gorjetas+portagens-taxa/comissao-pagamentos',trips,boltTips,uberTips,boltTolls,uberTolls}),
      fareGross,tips,tolls,vatWithheld,commission
    ).run();
    results.push({driverId:driver.id,driverName:driver.name,weekStart,weekEnd,balance,direction:direction(balance)});
  }
  return results;
}

export async function listSettlements(db, weekStart) {
  const r=await db.prepare(`SELECT s.*,d.name driver_name,d.phone driver_phone,r.operator_commission_basis_points,r.vat_rate_basis_points,r.charge_type,r.notes rule_notes,
    (s.platform_net_cents+s.percentage_deduction_cents+s.weekly_rent_cents-s.credits_cents+s.debits_cents) settlement_base_cents,
    (s.weekly_rent_cents+s.percentage_deduction_cents) company_gain_cents
    FROM weekly_settlements s JOIN drivers d ON d.id=s.driver_id LEFT JOIN settlement_rules r ON r.driver_id=s.driver_id
    WHERE s.week_start=? ORDER BY d.name`).bind(weekStart).all();
  return r.results||[];
}

export async function listSettlementRules(db) {
  const drivers = (await db.prepare(`
    SELECT DISTINCT d.id
    FROM drivers d
    JOIN driver_platform_accounts a ON a.driver_id=d.id
    WHERE LOWER(COALESCE(d.status,'active')) NOT IN ('inactive','disabled','deactivated','blocked')
      AND LOWER(COALESCE(a.platform_status,'active')) NOT IN ('inactive','disabled','deactivated','blocked','rejected')
  `).all()).results || [];
  for (const driver of drivers) await ensureDefaultRule(db, driver.id);
  const r=await db.prepare(`SELECT d.id driver_id,d.name driver_name,d.phone,
    1 AS active,r.mode,r.weekly_rent_cents,r.include_bolt,r.include_uber,600 AS vat_rate_basis_points,
    r.operator_commission_basis_points,r.charge_type,r.notes,r.updated_at,
    GROUP_CONCAT(DISTINCT a.platform) AS platforms
    FROM drivers d
    JOIN settlement_rules r ON r.driver_id=d.id
    JOIN driver_platform_accounts a ON a.driver_id=d.id
    WHERE LOWER(COALESCE(d.status,'active')) NOT IN ('inactive','disabled','deactivated','blocked')
      AND LOWER(COALESCE(a.platform_status,'active')) NOT IN ('inactive','disabled','deactivated','blocked','rejected')
    GROUP BY d.id
    ORDER BY d.name`).all();
  return r.results||[];
}

function periodBounds(period, referenceDate) {
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(String(referenceDate || '')) ? String(referenceDate) : new Date().toISOString().slice(0, 10);
  const [year, month] = ref.split('-').map(Number);
  if (period === 'annual') return { start: `${year}-01-01`, end: `${year}-12-31`, label: String(year) };
  if (period === 'quarterly') {
    const quarter = Math.floor((month - 1) / 3) + 1;
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const endDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
    return {
      start: `${year}-${String(startMonth).padStart(2, '0')}-01`,
      end: `${year}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
      label: `${quarter}.º trimestre de ${year}`,
    };
  }
  const start = ref;
  return { start, end: addDays(start, 6), label: `Semana de ${start}` };
}

export async function settlementAnalysis(db, { driverId, period = 'weekly', referenceDate }) {
  if (!driverId) throw new Error('Seleciona um motorista.');
  const allowed = ['weekly', 'quarterly', 'annual'];
  const normalizedPeriod = allowed.includes(period) ? period : 'weekly';
  const bounds = periodBounds(normalizedPeriod, referenceDate);
  const driver = await db.prepare('SELECT id,name,phone FROM drivers WHERE id=?').bind(driverId).first();
  if (!driver) throw new Error('Motorista não encontrado.');
  const rule = await ensureDefaultRule(db, driverId);
  const raw = (await db.prepare(`
    SELECT date(service_date, '-' || ((CAST(strftime('%w', service_date) AS INTEGER)+6)%7) || ' days') AS week_start,
      COALESCE(SUM(CASE WHEN platform='Bolt' THEN MAX(0,net_cents-tip_cents-toll_cents) ELSE MAX(0,gross_cents-tip_cents-toll_cents) END),0) fare_gross_cents,
      COALESCE(SUM(tip_cents),0) tips_cents,
      COALESCE(SUM(toll_cents),0) tolls_cents,
      COALESCE(SUM(trip_count),0) trips,
      COALESCE(SUM(CASE WHEN platform='Bolt' THEN CASE WHEN platform='Bolt' THEN MAX(0,net_cents-tip_cents-toll_cents) ELSE MAX(0,gross_cents-tip_cents-toll_cents) END ELSE 0 END),0) bolt_fare_cents,
      COALESCE(SUM(CASE WHEN platform='Uber' THEN CASE WHEN platform='Bolt' THEN MAX(0,net_cents-tip_cents-toll_cents) ELSE MAX(0,gross_cents-tip_cents-toll_cents) END ELSE 0 END),0) uber_fare_cents
    FROM financial_entries
    WHERE driver_id=? AND service_date BETWEEN ? AND ?
    GROUP BY week_start ORDER BY week_start
  `).bind(driverId,bounds.start,bounds.end).all()).results || [];
  const saved = (await db.prepare(`SELECT * FROM weekly_settlements WHERE driver_id=? AND week_start BETWEEN ? AND ?`).bind(driverId,bounds.start,bounds.end).all()).results || [];
  const savedByWeek = new Map(saved.map(row=>[row.week_start,row]));
  const rows = raw.map(row=>{
    const fare=Number(row.fare_gross_cents||0), tips=Number(row.tips_cents||0), tolls=Number(row.tolls_cents||0);
    const fareNet=Math.round(fare/1.06), vat=fare-fareNet, base=fareNet+tips+tolls;
    const commission=Math.round(base*Number(rule.operator_commission_basis_points||0)/10000);
    const charge=Number(rule.weekly_rent_cents||0);
    const existing=savedByWeek.get(row.week_start)||{};
    return {...row, week_end:addDays(row.week_start,6), vat_withheld_cents:vat, fare_net_cents:fareNet,
      settlement_base_cents:base, operator_commission_calculated_cents:commission,
      weekly_rent_cents:charge, operator_gain_cents:commission+charge,
      driver_entitlement_cents:base-commission-charge,
      payments_cents:Number(existing.payments_cents||0),
      balance_cents:base-commission-charge-Number(existing.payments_cents||0)};
  });
  const sum = key => rows.reduce((t,r)=>t+Number(r[key]||0),0);
  const summary={fareGrossCents:sum('fare_gross_cents'),vatWithheldCents:sum('vat_withheld_cents'),fareNetOfVatCents:sum('fare_net_cents'),
    tipsCents:sum('tips_cents'),tollsCents:sum('tolls_cents'),settlementBaseCents:sum('settlement_base_cents'),
    rentalOrSlotCents:sum('weekly_rent_cents'),percentageCents:sum('operator_commission_calculated_cents'),operatorGainCents:sum('operator_gain_cents'),
    driverEntitlementCents:sum('driver_entitlement_cents'),paymentsCents:sum('payments_cents'),balanceCents:sum('balance_cents'),weeks:rows.length,trips:sum('trips')};
  return { driver, rule, period: normalizedPeriod, ...bounds, summary, rows };
}

export async function activateAllSettlementRules(db) {
  const drivers = (await db.prepare(`SELECT DISTINCT d.id FROM drivers d JOIN driver_platform_accounts a ON a.driver_id=d.id
    WHERE LOWER(COALESCE(d.status,'active')) NOT IN ('inactive','disabled','deactivated','blocked')
      AND LOWER(COALESCE(a.platform_status,'active')) NOT IN ('inactive','disabled','deactivated','blocked','rejected')`).all()).results || [];
  for (const driver of drivers) {
    await ensureDefaultRule(db, driver.id);
  }
  await db.prepare('UPDATE settlement_rules SET active=1, vat_rate_basis_points=600, updated_at=CURRENT_TIMESTAMP').run();
  return { activated: drivers.length };
}
