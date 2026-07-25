function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOf(isoDate) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const diff = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0,10);
}
function periodBounds(referenceDate, period) {
  const ref = referenceDate || new Date().toISOString().slice(0,10);
  const thisMonday = mondayOf(ref);
  if (period === 'this_week') return {start:thisMonday,end:addDays(thisMonday,6)};
  if (period === 'last_week') { const s=addDays(thisMonday,-7); return {start:s,end:addDays(s,6)}; }
  if (period === 'four_weeks') { const s=addDays(thisMonday,-21); return {start:s,end:addDays(thisMonday,6)}; }
  if (period === 'quarter') {
    const [y,m]=ref.split('-').map(Number), qm=Math.floor((m-1)/3)*3+1, endDay=new Date(Date.UTC(y,qm+3,0)).getUTCDate();
    return {start:`${y}-${String(qm).padStart(2,'0')}-01`,end:`${y}-${String(qm+2).padStart(2,'0')}-${String(endDay).padStart(2,'0')}`};
  }
  return {start:`${ref.slice(0,4)}-01-01`,end:`${ref.slice(0,4)}-12-31`};
}

export async function fleetMirror(db, { period = 'month', referenceDate } = {}) {
  const {start:startDate,end:endDate}=periodBounds(referenceDate,period);
  const drivers = (await db.prepare(`
    SELECT d.id, d.name, d.status, d.phone, d.email, d.current_vehicle_id,
      GROUP_CONCAT(DISTINCT a.platform) AS platforms,
      MAX(CASE WHEN a.platform='Bolt' THEN a.platform_status END) AS bolt_status,
      MAX(CASE WHEN a.platform='Uber' THEN a.platform_status END) AS uber_status,
      MAX(CASE WHEN a.platform='Bolt' THEN a.rating END) AS bolt_rating,
      MAX(CASE WHEN a.platform='Uber' THEN a.rating END) AS uber_rating
    FROM drivers d
    JOIN driver_platform_accounts a ON a.driver_id=d.id
    WHERE LOWER(COALESCE(d.status,'active')) NOT IN ('inactive','disabled','deactivated','blocked')
      AND LOWER(COALESCE(a.platform_status,'active')) NOT IN ('inactive','disabled','deactivated','blocked','rejected')
    GROUP BY d.id
    ORDER BY d.name
  `).all()).results || [];

  const financial = (await db.prepare(`
    SELECT driver_id, platform,
      COALESCE(SUM(CASE WHEN platform='Bolt' THEN MAX(0,net_cents-tip_cents-toll_cents) ELSE MAX(0,gross_cents-tip_cents-toll_cents) END),0) AS fare_gross_cents,
      COALESCE(SUM(CASE WHEN platform='Bolt' THEN net_cents ELSE gross_cents END),0) AS platform_payable_cents,
      COALESCE(SUM(campaign_cents),0) AS campaign_cents,
      COALESCE(SUM(reimbursement_cents),0) AS reimbursement_cents,
      COALESCE(SUM(cancellation_cents),0) AS cancellation_cents,
      COALESCE(SUM(booking_fee_cents),0) AS booking_fee_cents,
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
    const platformPayable = Number(b.platform_payable_cents || 0) + Number(u.platform_payable_cents || 0);
    const campaign = Number(b.campaign_cents || 0) + Number(u.campaign_cents || 0);
    const reimbursements = Number(b.reimbursement_cents || 0) + Number(u.reimbursement_cents || 0);
    const cancellations = Number(b.cancellation_cents || 0) + Number(u.cancellation_cents || 0);
    const bookingFees = Number(b.booking_fee_cents || 0) + Number(u.booking_fee_cents || 0);
    const tolls = Number(b.tolls_cents || 0) + Number(u.tolls_cents || 0);
    const vatRate = Number(driver.rule?.vat_rate_basis_points ?? 600);
    const fareNet = Math.round(fare * 10000 / (10000 + vatRate));
    const base = fareNet + tips + tolls;
    return {
      ...driver,
      total: {
        fareGrossCents: fare,
        platformPayableCents: platformPayable,
        campaignCents: campaign, reimbursementCents: reimbursements, cancellationCents: cancellations, bookingFeeCents: bookingFees,
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
    for (const key of ['fareGrossCents','platformPayableCents','campaignCents','reimbursementCents','cancellationCents','bookingFeeCents','vatCents','fareNetCents','tipsCents','tollsCents','settlementBaseCents','trips','hoursOnline','distanceKm']) acc[key] += Number(row.total[key] || 0);
    acc.operatorGainCents += Number(row.settlement?.operator_gain_cents || 0);
    acc.driverEntitlementCents += Number(row.settlement?.driver_entitlement_cents || 0);
    acc.paymentsCents += Number(row.settlement?.payments_cents || 0);
    acc.balanceCents += Number(row.settlement?.balance_cents || 0);
    return acc;
  }, { fareGrossCents:0, platformPayableCents:0, campaignCents:0, reimbursementCents:0, cancellationCents:0, bookingFeeCents:0, vatCents:0, fareNetCents:0, tipsCents:0, tollsCents:0, settlementBaseCents:0, trips:0, hoursOnline:0, distanceKm:0, operatorGainCents:0, driverEntitlementCents:0, paymentsCents:0, balanceCents:0 });

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
