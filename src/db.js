export function uid(prefix = '') {
  return `${prefix}${crypto.randomUUID()}`;
}

export function normalizePlate(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function cents(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

export function fromAmountE5(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.round(number / 1000) : 0;
}

export function isoFromUnixSeconds(value) {
  const number = Number(value || 0);
  return new Date(number * 1000).toISOString();
}

export function lisbonDate(isoOrDate) {
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export async function getSetting(db, key, fallback = null) {
  const row = await db.prepare('SELECT value FROM app_settings WHERE key = ?').bind(key).first();
  return row?.value ?? fallback;
}

export async function setSetting(db, key, value) {
  await db.prepare(`
    INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).bind(key, String(value)).run();
}

export async function upsertDriver(db, input) {
  const platform = input.platform;
  const externalId = input.externalDriverId || null;
  let driverId = null;

  if (externalId) {
    const account = await db.prepare(
      'SELECT driver_id FROM driver_platform_accounts WHERE platform = ? AND external_driver_id = ?'
    ).bind(platform, externalId).first();
    driverId = account?.driver_id || null;
  }

  if (!driverId && input.phone) {
    const existing = await db.prepare('SELECT id FROM drivers WHERE phone = ? LIMIT 1').bind(input.phone).first();
    driverId = existing?.id || null;
  }

  if (!driverId) driverId = uid('drv_');

  await db.prepare(`
    INSERT INTO drivers (id, name, phone, email, tvde_license, status, current_vehicle_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name = COALESCE(NULLIF(excluded.name, ''), drivers.name),
      phone = COALESCE(NULLIF(excluded.phone, ''), drivers.phone),
      email = COALESCE(NULLIF(excluded.email, ''), drivers.email),
      status = COALESCE(NULLIF(excluded.status, ''), drivers.status),
      current_vehicle_id = COALESCE(excluded.current_vehicle_id, drivers.current_vehicle_id),
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    driverId,
    input.name || 'Motorista',
    input.phone || null,
    input.email || null,
    input.tvdeLicense || null,
    input.status || 'active',
    input.currentVehicleId || null,
  ).run();

  if (platform && externalId) {
    const accountId = `${platform.toLowerCase()}_drv_${externalId}`;
    await db.prepare(`
      INSERT INTO driver_platform_accounts
        (id, driver_id, platform, external_driver_id, external_partner_id, organization_id, platform_status, rating, score, raw_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(platform, external_driver_id) DO UPDATE SET
        driver_id = excluded.driver_id,
        external_partner_id = excluded.external_partner_id,
        organization_id = excluded.organization_id,
        platform_status = excluded.platform_status,
        rating = excluded.rating,
        score = excluded.score,
        raw_json = excluded.raw_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      accountId, driverId, platform, externalId, input.externalPartnerId || null,
      input.organizationId || null, input.platformStatus || null,
      input.rating ?? null, input.score ?? null, JSON.stringify(input.raw || {}),
    ).run();
  }
  return driverId;
}

export async function upsertVehicle(db, input) {
  const plate = normalizePlate(input.licensePlate);
  if (!plate) return null;
  const platform = input.platform;
  const externalId = input.externalVehicleId || null;
  let vehicleId = null;

  if (externalId && platform) {
    const account = await db.prepare(
      'SELECT vehicle_id FROM vehicle_platform_accounts WHERE platform = ? AND external_vehicle_id = ?'
    ).bind(platform, externalId).first();
    vehicleId = account?.vehicle_id || null;
  }
  if (!vehicleId) {
    const existing = await db.prepare('SELECT id FROM vehicles WHERE license_plate = ?').bind(plate).first();
    vehicleId = existing?.id || uid('veh_');
  }

  await db.prepare(`
    INSERT INTO vehicles (id, license_plate, make, model, year, vin, color, seats, status, current_driver_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(license_plate) DO UPDATE SET
      make = COALESCE(NULLIF(excluded.make, ''), vehicles.make),
      model = COALESCE(NULLIF(excluded.model, ''), vehicles.model),
      year = COALESCE(excluded.year, vehicles.year),
      vin = COALESCE(NULLIF(excluded.vin, ''), vehicles.vin),
      color = COALESCE(NULLIF(excluded.color, ''), vehicles.color),
      seats = COALESCE(excluded.seats, vehicles.seats),
      status = COALESCE(NULLIF(excluded.status, ''), vehicles.status),
      current_driver_id = COALESCE(excluded.current_driver_id, vehicles.current_driver_id),
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    vehicleId, plate, input.make || null, input.model || null, input.year || null,
    input.vin || null, input.color || null, input.seats || null,
    input.status || 'active', input.currentDriverId || null,
  ).run();

  if (platform && externalId) {
    await db.prepare(`
      INSERT INTO vehicle_platform_accounts
        (id, vehicle_id, platform, external_vehicle_id, external_vehicle_id_encrypted, organization_id, platform_status, raw_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(platform, external_vehicle_id) DO UPDATE SET
        vehicle_id = excluded.vehicle_id,
        external_vehicle_id_encrypted = excluded.external_vehicle_id_encrypted,
        organization_id = excluded.organization_id,
        platform_status = excluded.platform_status,
        raw_json = excluded.raw_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      `${platform.toLowerCase()}_veh_${externalId}`, vehicleId, platform, externalId,
      input.externalVehicleIdEncrypted || null, input.organizationId || null,
      input.platformStatus || null, JSON.stringify(input.raw || {}),
    ).run();
  }
  return vehicleId;
}

export async function upsertFinancialEntry(db, input) {
  const existing = await db.prepare(
    'SELECT id FROM financial_entries WHERE platform = ? AND external_id = ?'
  ).bind(input.platform, input.externalId).first();
  const id = existing?.id || uid('ent_');
  await db.prepare(`
    INSERT INTO financial_entries (
      id, platform, external_id, entry_type, driver_id, vehicle_id, occurred_at, service_date, status,
      trip_count, hours_online, hours_on_trip, gross_cents, net_cents, commission_cents, tip_cents,
      toll_cents, cash_collected_cents, currency, distance_km, description, raw_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(platform, external_id) DO UPDATE SET
      entry_type = excluded.entry_type,
      driver_id = COALESCE(excluded.driver_id, financial_entries.driver_id),
      vehicle_id = COALESCE(excluded.vehicle_id, financial_entries.vehicle_id),
      occurred_at = excluded.occurred_at,
      service_date = excluded.service_date,
      status = excluded.status,
      trip_count = excluded.trip_count,
      hours_online = excluded.hours_online,
      hours_on_trip = excluded.hours_on_trip,
      gross_cents = excluded.gross_cents,
      net_cents = excluded.net_cents,
      commission_cents = excluded.commission_cents,
      tip_cents = excluded.tip_cents,
      toll_cents = excluded.toll_cents,
      cash_collected_cents = excluded.cash_collected_cents,
      currency = excluded.currency,
      distance_km = excluded.distance_km,
      description = excluded.description,
      raw_json = excluded.raw_json,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    id, input.platform, input.externalId, input.entryType || 'trip', input.driverId || null,
    input.vehicleId || null, input.occurredAt, input.serviceDate, input.status || null,
    input.tripCount || 0, input.hoursOnline || 0, input.hoursOnTrip || 0,
    input.grossCents || 0, input.netCents || 0, input.commissionCents || 0,
    input.tipCents || 0, input.tollCents || 0, input.cashCollectedCents || 0,
    input.currency || 'EUR', input.distanceKm || 0, input.description || null,
    JSON.stringify(input.raw || {}),
  ).run();
  return { created: !existing, id };
}

export async function createSyncRun(db, platform, syncType) {
  const id = uid('sync_');
  await db.prepare(`
    INSERT INTO sync_runs (id, platform, sync_type, started_at, status)
    VALUES (?, ?, ?, ?, 'running')
  `).bind(id, platform, syncType, new Date().toISOString()).run();
  return id;
}

export async function finishSyncRun(db, id, result, error = null) {
  await db.prepare(`
    UPDATE sync_runs SET finished_at = ?, status = ?, records_received = ?, records_created = ?,
      records_updated = ?, error_message = ?, details_json = ? WHERE id = ?
  `).bind(
    new Date().toISOString(), error ? 'error' : 'success', result?.received || 0,
    result?.created || 0, result?.updated || 0, error ? String(error.message || error) : null,
    JSON.stringify(result || {}), id,
  ).run();
}

export async function snapshot(db) {
  const [drivers, vehicles, entries, syncRuns] = await Promise.all([
    db.prepare(`
      SELECT d.*, GROUP_CONCAT(DISTINCT a.platform) AS platforms
      FROM drivers d LEFT JOIN driver_platform_accounts a ON a.driver_id = d.id
      GROUP BY d.id ORDER BY d.name
    `).all(),
    db.prepare('SELECT * FROM vehicles ORDER BY license_plate').all(),
    db.prepare(`
      SELECT * FROM financial_entries ORDER BY occurred_at DESC LIMIT 10000
    `).all(),
    db.prepare('SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 20').all(),
  ]);
  return {
    drivers: drivers.results || [],
    vehicles: vehicles.results || [],
    entries: entries.results || [],
    syncRuns: syncRuns.results || [],
  };
}
