function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function periodStart(referenceDate, period) {
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  if (period === 'week') return addDays(ref, -6);
  if (period === 'quarter') return addDays(ref, -89);
  if (period === 'year') return `${ref.slice(0, 4)}-01-01`;
  return addDays(ref, -29);
}

export async function fleetMirror(db, { period = 'month', referenceDate } = {}) {
  const endDate = referenceDate || new Date().toISOString().slice(0, 10);
  const startDate = periodStart(endDate, period);
  const drivers = (await db.prepare(`
    SELECT d.id, d.name, d.status, d.phone, d.email, d.current_vehicle_id,
      GROUP_CONCAT(DISTINCT a.platform) AS platforms,
      MAX(CASE WHEN a.platform='Bolt' THEN a.platform_status END) AS bolt_status,
      MAX(CASE WHEN a.platform='Uber' THEN a.platform_status END) AS uber_status,
      MAX(CASE WHEN a.platform='Bolt' THEN a.rating END) AS bolt_rating,
      MAX(CASE WHEN a.platform='Uber' THEN a.rating END) AS uber_rating
    FROM drivers d
    LEFT JOIN driver_platform_accounts a ON a.driver_id=d.id
    GROUP BY d.id
    ORDER BY d.name
  `).all()).results || [];

  const financial = (await db.prepare(`
    SELECT driver_id, platform,
      COALESCE(SUM(MAX(0,gross_cents-tip_cents-toll_cents)),0) AS fare_gross_cents,
      COALESCE(SUM(tip_cents),0) AS tips_cents,
      COALESCE(SUM(toll_cents),0) AS tolls_cents,
      COALESCE(SUM(trip_count),0) AS trips,
      COALESCE(SUM(hours_online),0) AS hours_online,
      COALESCE(SUM(distance_km),0) AS distance_km,
      MAX(service_date) AS last_activity
    FROM financial_entries
    WHERE service_date BETWEEN ? AND ?
    GROUP BY driver_id, platform
  `).bind(startDate, endDate).all()).results || [];

  const rules = (await db.prepare(`SELECT * FROM settlement_rules`).all()).results || [];
  const settlements = (await db.prepare(`
    SELECT driver_id,
      COALESCE(SUM(fare_gross_cents),0) AS fare_gross_cents,
      COALESCE(SUM(vat_withheld_cents),0) AS vat_cents,
      COALESCE(SUM(tips_cents),0) AS tips_cents,
      COALESCE(SUM(tolls_cents),0) AS tolls_cents,
      COALESCE(SUM(weekly_rent_cents + operator_commission_calculated_cents),0) AS operator_gain_cents,
      COALESCE(SUM(platform_net_cents - weekly_rent_cents),0) AS driver_entitlement_cents,
      COALESCE(SUM(payments_cents),0) AS payments_cents,
      COALESCE(SUM(balance_cents),0) AS balance_cents
    FROM weekly_settlements
    WHERE week_start BETWEEN ? AND ?
    GROUP BY driver_id
  `).bind(startDate, endDate).all()).results || [];

  const byDriver = new Map();
  for (const driver of drivers) byDriver.set(driver.id, { ...driver, bolt: {}, uber: {}, total: {}, rule: null, settlement: null });
  for (const row of financial) {
    if (!byDriver.has(row.driver_id)) continue;
    const target = byDriver.get(row.driver_id);
    target[row.platform === 'Uber' ? 'uber' : 'bolt'] = row;
  }
  for (const rule of rules) if (byDriver.has(rule.driver_id)) byDriver.get(rule.driver_id).rule = rule;
  for (const row of settlements) if (byDriver.has(row.driver_id)) byDriver.get(row.driver_id).settlement = row;

  const rows = [...byDriver.values()].map((driver) => {
    const b = driver.bolt || {}, u = driver.uber || {};
    const fare = Number(b.fare_gross_cents || 0) + Number(u.fare_gross_cents || 0);
    const tips = Number(b.tips_cents || 0) + Number(u.tips_cents || 0);
    const tolls = Number(b.tolls_cents || 0) + Number(u.tolls_cents || 0);
    const vatRate = Number(driver.rule?.vat_rate_basis_points ?? 600);
    const fareNet = Math.round(fare * 10000 / (10000 + vatRate));
    const base = fareNet + tips + tolls;
    return {
      ...driver,
      total: {
        fareGrossCents: fare,
        vatCents: fare - fareNet,
        fareNetCents: fareNet,
        tipsCents: tips,
        tollsCents: tolls,
        settlementBaseCents: base,
        trips: Number(b.trips || 0) + Number(u.trips || 0),
        hoursOnline: Number(b.hours_online || 0) + Number(u.hours_online || 0),
        distanceKm: Number(b.distance_km || 0) + Number(u.distance_km || 0),
      },
    };
  });

  const summary = rows.reduce((acc, row) => {
    for (const key of ['fareGrossCents','vatCents','fareNetCents','tipsCents','tollsCents','settlementBaseCents','trips','hoursOnline','distanceKm']) acc[key] += Number(row.total[key] || 0);
    acc.operatorGainCents += Number(row.settlement?.operator_gain_cents || 0);
    acc.driverEntitlementCents += Number(row.settlement?.driver_entitlement_cents || 0);
    acc.paymentsCents += Number(row.settlement?.payments_cents || 0);
    acc.balanceCents += Number(row.settlement?.balance_cents || 0);
    return acc;
  }, { fareGrossCents:0, vatCents:0, fareNetCents:0, tipsCents:0, tollsCents:0, settlementBaseCents:0, trips:0, hoursOnline:0, distanceKm:0, operatorGainCents:0, driverEntitlementCents:0, paymentsCents:0, balanceCents:0 });

  return { startDate, endDate, period, summary, drivers: rows };
}

export async function driverMirror(db, { driverId, period = 'year', referenceDate } = {}) {
  if (!driverId) throw new Error('Motorista obrigatório.');
  const fleet = await fleetMirror(db, { period, referenceDate });
  const driver = fleet.drivers.find((item) => item.id === driverId);
  if (!driver) throw new Error('Motorista não encontrado.');
  const weekly = (await db.prepare(`
    SELECT * FROM weekly_settlements
    WHERE driver_id=? AND week_start BETWEEN ? AND ?
    ORDER BY week_start DESC
  `).bind(driverId, fleet.startDate, fleet.endDate).all()).results || [];
  return { ...fleet, driver, weekly };
}
