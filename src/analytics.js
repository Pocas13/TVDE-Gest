import { getSetting } from './db.js';

const ORG_ID = 'org_daniel_sc';

function isoDate(value = new Date()) {
  return (value instanceof Date ? value : new Date(value)).toISOString().slice(0, 10);
}
function addDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return isoDate(d);
}
function daysBetween(start, end) {
  return Math.floor((new Date(`${end}T12:00:00Z`) - new Date(`${start}T12:00:00Z`)) / 86400000) + 1;
}
function mondayOf(date) {
  const d = new Date(`${date}T12:00:00Z`); const offset = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - offset); return isoDate(d);
}
function monthEnd(year, month) { return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10); }

export function periodBounds({ period = 'this_week', referenceDate, startDate, endDate } = {}) {
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(String(referenceDate || '')) ? referenceDate : isoDate();
  if (period === 'custom') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '') || startDate > endDate) throw new Error('Intervalo personalizado inválido.');
    return { startDate, endDate, label: `${startDate} — ${endDate}` };
  }
  const monday = mondayOf(ref);
  if (period === 'today') return { startDate: ref, endDate: ref, label: 'Hoje' };
  if (period === 'this_week') return { startDate: monday, endDate: addDays(monday, 6), label: 'Esta semana' };
  if (period === 'last_week') { const start = addDays(monday, -7); return { startDate: start, endDate: addDays(start, 6), label: 'Semana anterior' }; }
  if (period === 'four_weeks') { const start = addDays(monday, -21); return { startDate: start, endDate: addDays(monday, 6), label: 'Últimas 4 semanas' }; }
  const [year, month] = ref.split('-').map(Number);
  if (period === 'month') return { startDate: `${year}-${String(month).padStart(2, '0')}-01`, endDate: monthEnd(year, month), label: 'Mês atual' };
  if (period === 'quarter') {
    const first = Math.floor((month - 1) / 3) * 3 + 1;
    return { startDate: `${year}-${String(first).padStart(2, '0')}-01`, endDate: monthEnd(year, first + 2), label: `${Math.floor((month - 1) / 3) + 1}.º trimestre` };
  }
  return { startDate: `${year}-01-01`, endDate: `${year}-12-31`, label: String(year) };
}

function previousBounds(bounds) {
  const length = daysBetween(bounds.startDate, bounds.endDate);
  const endDate = addDays(bounds.startDate, -1);
  return { startDate: addDays(endDate, -length + 1), endDate };
}

function zeroMetrics() {
  return {
    grossCents: 0, platformPayableCents: 0, fareGrossCents: 0, vatCents: 0, fareNetCents: 0,
    tipsCents: 0, tollsCents: 0, campaignCents: 0, reimbursementCents: 0, cancellationCents: 0,
    bookingFeeCents: 0, commissionCents: 0, settlementBaseCents: 0, trips: 0, hoursOnline: 0,
    hoursOnTrip: 0, distanceKm: 0, acceptanceRate: null, utilizationRate: null, completionRate: null, rating: null,
  };
}
function addMetric(target, source) {
  for (const key of ['grossCents','platformPayableCents','fareGrossCents','tipsCents','tollsCents','campaignCents','reimbursementCents','cancellationCents','bookingFeeCents','commissionCents','trips','hoursOnline','hoursOnTrip','distanceKm']) {
    target[key] += Number(source[key] || 0);
  }
  for (const key of ['acceptanceRate','utilizationRate','completionRate','rating']) if (source[key] != null && Number(source[key]) > 0) target[key] = Number(source[key]);
}
function finalize(metrics) {
  const fareNet = Math.round(metrics.fareGrossCents / 1.06);
  metrics.fareNetCents = fareNet;
  metrics.vatCents = metrics.fareGrossCents - fareNet;
  metrics.settlementBaseCents = fareNet + metrics.tipsCents + metrics.tollsCents;
  metrics.revenuePerTripCents = metrics.trips ? Math.round(metrics.platformPayableCents / metrics.trips) : 0;
  metrics.revenuePerOnlineHourCents = metrics.hoursOnline ? Math.round(metrics.platformPayableCents / metrics.hoursOnline) : 0;
  metrics.utilizationCalculated = metrics.hoursOnline ? Math.round(metrics.hoursOnTrip * 1000 / metrics.hoursOnline) / 10 : null;
  return metrics;
}
function aggregateRow(row, platform) {
  const tips = Number(row.tips_cents || 0), tolls = Number(row.tolls_cents || 0);
  const payable = platform === 'Bolt' ? Number(row.net_cents || 0) : Number(row.net_cents || row.gross_cents || 0);
  return {
    grossCents: Number(row.gross_cents || 0), platformPayableCents: payable,
    fareGrossCents: Math.max(0, payable - tips - tolls), tipsCents: tips, tollsCents: tolls,
    campaignCents: Number(row.campaign_cents || 0), reimbursementCents: Number(row.reimbursement_cents || 0),
    cancellationCents: Number(row.cancellation_cents || 0), bookingFeeCents: Number(row.booking_fee_cents || 0),
    commissionCents: Number(row.commission_cents || 0), trips: Number(row.trip_count || 0),
    hoursOnline: Number(row.hours_online || 0), hoursOnTrip: Number(row.hours_on_trip || 0), distanceKm: Number(row.distance_km || 0),
    acceptanceRate: row.acceptance_rate, utilizationRate: row.utilization_rate, completionRate: row.completion_rate, rating: row.rating,
  };
}

async function loadRows(db, bounds) {
  const cutover = await getSetting(db, 'bolt_aggregate_cutover_date', '2026-07-20');
  const detailed = (await db.prepare(`SELECT * FROM financial_entries
    WHERE service_date BETWEEN ? AND ?
      AND (platform<>'Bolt' OR service_date>=?)`).bind(bounds.startDate, bounds.endDate, cutover).all()).results || [];
  // Dados agregados só entram quando o relatório contém o período completo. Nunca são rateados artificialmente.
  const aggregates = (await db.prepare(`SELECT * FROM aggregate_driver_periods
    WHERE period_start>=? AND period_end<=?`).bind(bounds.startDate, bounds.endDate).all()).results || [];
  const activity = (await db.prepare(`SELECT * FROM activity_driver_periods
    WHERE period_start>=? AND period_end<=?`).bind(bounds.startDate, bounds.endDate).all()).results || [];
  return { detailed, aggregates, activity, cutover };
}

async function build(db, bounds) {
  const [driverRows, vehicleRows, rulesRows, settlementRows, rows] = await Promise.all([
    db.prepare(`SELECT d.*,GROUP_CONCAT(DISTINCT a.platform) platforms,
      MAX(CASE WHEN a.platform='Bolt' THEN a.platform_status END) bolt_status,
      MAX(CASE WHEN a.platform='Uber' THEN a.platform_status END) uber_status,
      MAX(CASE WHEN a.platform='Bolt' THEN a.rating END) bolt_rating,
      MAX(CASE WHEN a.platform='Uber' THEN a.rating END) uber_rating
      FROM drivers d LEFT JOIN driver_platform_accounts a ON a.driver_id=d.id GROUP BY d.id ORDER BY d.name`).all(),
    db.prepare(`SELECT * FROM vehicles ORDER BY license_plate`).all(),
    db.prepare(`SELECT * FROM settlement_rules`).all(),
    db.prepare(`SELECT driver_id,COALESCE(SUM(weekly_rent_cents+operator_commission_calculated_cents),0) operator_gain_cents,
      COALESCE(SUM(payments_cents),0) payments_cents,COALESCE(SUM(balance_cents),0) balance_cents
      FROM weekly_settlements WHERE week_start BETWEEN ? AND ? GROUP BY driver_id`).bind(bounds.startDate, bounds.endDate).all(),
    loadRows(db, bounds),
  ]);
  const drivers = driverRows.results || [], vehicles = vehicleRows.results || [], rules = rulesRows.results || [], settlements = settlementRows.results || [];
  const byDriver = new Map(drivers.map((driver) => [driver.id, { ...driver, bolt: zeroMetrics(), uber: zeroMetrics(), total: zeroMetrics(), settlement: null, rule: null, sources: new Set() }]));
  const ensureDriver = (id) => byDriver.get(id);

  for (const row of rows.detailed) {
    const driver = ensureDriver(row.driver_id); if (!driver) continue;
    const platform = row.platform === 'Uber' ? 'uber' : 'bolt';
    addMetric(driver[platform], aggregateRow(row, row.platform)); driver.sources.add(`${row.platform} API`);
  }
  for (const row of rows.aggregates) {
    const driver = ensureDriver(row.driver_id); if (!driver) continue;
    const platform = row.platform === 'Uber' ? 'uber' : 'bolt';
    addMetric(driver[platform], aggregateRow(row, row.platform)); driver.sources.add(`${row.platform} CSV`);
  }
  for (const row of rows.activity) {
    const driver = ensureDriver(row.driver_id); if (!driver) continue;
    const platform = row.platform === 'Uber' ? 'uber' : 'bolt';
    // Evita duplicar viagens/horas se já existir um relatório financeiro com métricas para o mesmo período.
    if (!driver[platform].trips) driver[platform].trips += Number(row.trip_count || 0);
    if (!driver[platform].hoursOnline) driver[platform].hoursOnline += Number(row.hours_online || 0);
    if (!driver[platform].hoursOnTrip) driver[platform].hoursOnTrip += Number(row.hours_on_trip || 0);
    driver.sources.add(`${row.platform} atividade`);
  }
  for (const rule of rules) if (byDriver.has(rule.driver_id)) byDriver.get(rule.driver_id).rule = rule;
  for (const row of settlements) if (byDriver.has(row.driver_id)) byDriver.get(row.driver_id).settlement = row;

  const resultDrivers = [...byDriver.values()].map((driver) => {
    finalize(driver.bolt); finalize(driver.uber);
    addMetric(driver.total, driver.bolt); addMetric(driver.total, driver.uber); finalize(driver.total);
    const rating = Math.max(Number(driver.bolt.rating || driver.bolt_rating || 0), Number(driver.uber.rating || driver.uber_rating || 0));
    const productivity = Math.min(100, driver.total.revenuePerOnlineHourCents / 1200 * 100);
    const utilization = driver.total.utilizationCalculated ?? driver.total.utilizationRate ?? 0;
    const ratingScore = rating ? Math.min(100, rating / 5 * 100) : 70;
    const activityScore = driver.total.trips ? Math.min(100, driver.total.trips / Math.max(1, daysBetween(bounds.startDate, bounds.endDate)) * 10) : 0;
    const score = Math.round(productivity * .4 + utilization * .25 + ratingScore * .2 + activityScore * .15);
    const active = [driver.bolt_status, driver.uber_status].some((status) => String(status).toLowerCase() === 'active');
    return { ...driver, active, score: Math.max(0, Math.min(100, score)), rating, sources: [...driver.sources] };
  }).filter((driver) => driver.total.platformPayableCents || driver.total.trips || driver.active);

  const summary = zeroMetrics();
  for (const driver of resultDrivers) addMetric(summary, driver.total);
  finalize(summary);
  summary.operatorGainCents = resultDrivers.reduce((total, driver) => total + Number(driver.settlement?.operator_gain_cents || 0), 0);
  summary.paymentsCents = resultDrivers.reduce((total, driver) => total + Number(driver.settlement?.payments_cents || 0), 0);
  summary.balanceCents = resultDrivers.reduce((total, driver) => total + Number(driver.settlement?.balance_cents || 0), 0);
  summary.activeDrivers = resultDrivers.filter((driver) => driver.active).length;
  summary.activeVehicles = vehicles.filter((vehicle) => String(vehicle.status).toLowerCase() === 'active').length;
  summary.totalDrivers = resultDrivers.length;
  summary.totalVehicles = vehicles.length;

  const alerts = [];
  const ranked = [...resultDrivers].filter((driver) => driver.total.trips || driver.total.platformPayableCents).sort((a, b) => b.score - a.score);
  if (ranked[0]) alerts.push({ severity: 'success', title: `${ranked[0].name} lidera o período`, message: `Score ${ranked[0].score}/100 e ${ranked[0].total.trips} viagens.` });
  for (const driver of ranked.filter((item) => item.total.hoursOnline >= 8 && item.total.revenuePerOnlineHourCents < 600).slice(0, 3)) {
    alerts.push({ severity: 'warning', title: `Produtividade baixa — ${driver.name}`, message: `${(driver.total.revenuePerOnlineHourCents / 100).toFixed(2)} €/hora online.` });
  }
  for (const driver of resultDrivers.filter((item) => item.active && !item.total.trips).slice(0, 3)) alerts.push({ severity: 'info', title: `${driver.name} sem atividade no período`, message: 'Confirma a associação à plataforma ou o período selecionado.' });

  const platform = {
    bolt: resultDrivers.reduce((total, driver) => total + driver.bolt.platformPayableCents, 0),
    uber: resultDrivers.reduce((total, driver) => total + driver.uber.platformPayableCents, 0),
  };
  return { bounds, summary, drivers: resultDrivers, vehicles, alerts, platform, cutover: rows.cutover };
}

function pctChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round((current - previous) * 1000 / Math.abs(previous)) / 10;
}

export async function fleetMirror(db, options = {}) {
  const bounds = periodBounds(options);
  const current = await build(db, bounds);
  const previous = await build(db, previousBounds(bounds));
  current.comparison = {
    earningsPct: pctChange(current.summary.platformPayableCents, previous.summary.platformPayableCents),
    tripsPct: pctChange(current.summary.trips, previous.summary.trips),
    onlineHoursPct: pctChange(current.summary.hoursOnline, previous.summary.hoursOnline),
    previous: previous.summary,
  };
  current.cycles = {
    bolt: 'Segunda 00:00 → domingo 23:59',
    uber: 'Segunda 04:00 → segunda seguinte 03:59',
  };
  return current;
}

export async function driverMirror(db, options = {}) {
  if (!options.driverId) throw new Error('Motorista obrigatório.');
  const fleet = await fleetMirror(db, options);
  const driver = fleet.drivers.find((item) => item.id === options.driverId);
  if (!driver) throw new Error('Motorista não encontrado no período selecionado.');
  const weekly = (await db.prepare(`SELECT * FROM weekly_settlements WHERE driver_id=? AND week_start BETWEEN ? AND ? ORDER BY week_start DESC`)
    .bind(options.driverId, fleet.bounds.startDate, fleet.bounds.endDate).all()).results || [];
  return { ...fleet, driver, weekly };
}
