import {
  cents, createSyncRun, finishSyncRun, isoFromUnixSeconds, lisbonDate,
  upsertDriver, upsertFinancialEntry, upsertVehicle, getSetting, setSetting,
} from '../db.js';

const TOKEN_URL = 'https://oidc.bolt.eu/token';
const API_BASE = 'https://node.bolt.eu/fleet-integration-gateway/fleetIntegration/v1';
const TIMEOUT_MS = 25000;
const TOKEN_SAFETY_MS = 60000;
let cachedToken = null;
let cachedExpiry = 0;

function timeoutSignal(ms = TIMEOUT_MS) {
  return AbortSignal.timeout(ms);
}

function required(env, name) {
  const value = env[name];
  if (!value) throw new Error(`Configuração Bolt em falta: ${name}.`);
  return value;
}

async function boltToken(env, force = false) {
  const now = Date.now();
  if (!force && cachedToken && now < cachedExpiry - TOKEN_SAFETY_MS) return cachedToken;
  const body = new URLSearchParams({
    client_id: required(env, 'BOLT_CLIENT_ID'),
    client_secret: required(env, 'BOLT_CLIENT_SECRET'),
    grant_type: 'client_credentials',
    scope: 'fleet-integration:api',
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: timeoutSignal(),
  });
  if (!response.ok) throw new Error(`Autenticação Bolt falhou (${response.status}): ${await response.text()}`);
  const data = await response.json();
  cachedToken = data.access_token;
  cachedExpiry = now + Number(data.expires_in || 600) * 1000;
  return cachedToken;
}

export async function boltRequest(env, path, { method = 'GET', body = null } = {}, retry = true) {
  const token = await boltToken(env);
  const response = await fetch(`${API_BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: timeoutSignal(),
  });
  if (response.status === 401 && retry) {
    await boltToken(env, true);
    return boltRequest(env, path, { method, body }, false);
  }
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok || (data.code != null && Number(data.code) !== 0)) {
    const message = data.message || data.error || `Pedido Bolt falhou (${response.status}).`;
    throw new Error(`${message}${data.code ? ` [Bolt ${data.code}]` : ''}`);
  }
  return data;
}

export async function getBoltCompanyIds(env) {
  const data = await boltRequest(env, 'getCompanies');
  return data?.data?.company_ids || [];
}

async function resolveCompanyId(env) {
  const configured = Number(env.BOLT_COMPANY_ID || await getSetting(env.DB, 'bolt_company_id', '0'));
  if (Number.isInteger(configured) && configured > 0) return configured;
  const ids = await getBoltCompanyIds(env);
  if (!ids.length) throw new Error('A Bolt não devolveu qualquer company_id autorizado.');
  await setSetting(env.DB, 'bolt_company_id', ids[0]);
  return Number(ids[0]);
}

async function pages(env, path, body, listKey, limit, totalKey = null) {
  const all = [];
  let offset = 0;
  for (let page = 0; page < 100; page += 1) {
    const data = await boltRequest(env, path, { method: 'POST', body: { ...body, offset, limit } });
    const rows = data?.data?.[listKey];
    if (!Array.isArray(rows)) throw new Error(`Resposta Bolt sem data.${listKey}.`);
    all.push(...rows);
    const total = totalKey ? Number(data?.data?.[totalKey] || 0) : null;
    if (rows.length < limit || (total != null && all.length >= total)) break;
    offset += rows.length;
  }
  return all;
}


function splitRange(startTs, endTs, maxDays) {
  const windows = [];
  const step = maxDays * 86400;
  let cursor = startTs;
  while (cursor < endTs) {
    const next = Math.min(endTs, cursor + step);
    windows.push({ startTs: cursor, endTs: next });
    cursor = next;
  }
  return windows;
}

async function pagedWindows(env, path, body, listKey, limit, totalKey, maxDays, keyFn) {
  const rowsByKey = new Map();
  for (const window of splitRange(body.start_ts, body.end_ts, maxDays)) {
    const rows = await pages(env, path, { ...body, start_ts: window.startTs, end_ts: window.endTs }, listKey, limit, totalKey);
    for (const row of rows) {
      const key = keyFn(row) || JSON.stringify(row);
      rowsByKey.set(key, row);
    }
  }
  return [...rowsByKey.values()];
}

function rangeSeconds(days) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return { startTs: Math.floor(start.getTime() / 1000), endTs: Math.floor(end.getTime() / 1000) + 1 };
}

function boltStatus(value) {
  return value === 'active' ? 'active' : 'inactive';
}

async function syncBoltDrivers(env, companyId, startTs, endTs) {
  const rows = await pagedWindows(env, 'getDrivers', { company_id: companyId, start_ts: startTs, end_ts: endTs, portal_status: 'active' }, 'drivers', 1000, null, 30, (row) => row.driver_uuid || row.partner_uuid || row.phone);
  let created = 0;
  for (const row of rows) {
    let vehicleId = null;
    if (row.active_vehicle?.reg_number) {
      vehicleId = await upsertVehicle(env.DB, {
        platform: 'Bolt', externalVehicleId: String(row.active_vehicle.id || row.active_vehicle.uuid || ''),
        licensePlate: row.active_vehicle.reg_number, model: row.active_vehicle.model,
        year: row.active_vehicle.year, vin: row.active_vehicle.vin,
        status: boltStatus(row.active_vehicle.state), platformStatus: row.active_vehicle.state,
        organizationId: String(companyId), raw: row.active_vehicle,
      });
    }
    const before = await env.DB.prepare(
      'SELECT driver_id FROM driver_platform_accounts WHERE platform = ? AND external_driver_id = ?'
    ).bind('Bolt', row.driver_uuid || row.partner_uuid || '').first();
    const driverId = await upsertDriver(env.DB, {
      platform: 'Bolt', externalDriverId: row.driver_uuid || row.partner_uuid,
      externalPartnerId: row.partner_uuid, organizationId: String(companyId),
      name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.phone || 'Motorista Bolt',
      phone: row.phone, email: row.email, status: boltStatus(row.state), platformStatus: row.state,
      rating: row.driver_rating, score: row.driver_score, currentVehicleId: vehicleId, raw: row,
    });
    if (vehicleId) {
      await env.DB.prepare('UPDATE vehicles SET current_driver_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(driverId, vehicleId).run();
    }
    if (!before) created += 1;
  }
  return { received: rows.length, created, updated: rows.length - created };
}

async function syncBoltVehicles(env, companyId, startTs, endTs) {
  const rows = await pagedWindows(env, 'getVehicles', { company_id: companyId, start_ts: startTs, end_ts: endTs, portal_status: 'active' }, 'vehicles', 100, null, 30, (row) => String(row.id || row.uuid || row.reg_number));
  let created = 0;
  for (const row of rows) {
    const before = await env.DB.prepare(
      'SELECT vehicle_id FROM vehicle_platform_accounts WHERE platform = ? AND external_vehicle_id = ?'
    ).bind('Bolt', String(row.id || row.uuid || '')).first();
    await upsertVehicle(env.DB, {
      platform: 'Bolt', externalVehicleId: String(row.id || row.uuid || ''), licensePlate: row.reg_number,
      model: row.model, year: row.year, vin: row.vin, color: row.color, seats: row.seats,
      status: boltStatus(row.state), platformStatus: row.state, organizationId: String(companyId), raw: row,
    });
    if (!before) created += 1;
  }
  return { received: rows.length, created, updated: rows.length - created };
}

async function findBoltDriver(env, row, companyId) {
  if (!row.driver_uuid && !row.driver_phone) return null;
  return upsertDriver(env.DB, {
    platform: 'Bolt', externalDriverId: row.driver_uuid || `phone:${row.driver_phone}`,
    organizationId: String(companyId), name: row.driver_name || row.driver_phone || 'Motorista Bolt',
    phone: row.driver_phone, status: 'active', raw: { source: 'order', driver_uuid: row.driver_uuid },
  });
}

async function findBoltVehicle(env, row, companyId) {
  if (!row.vehicle_license_plate) return null;
  return upsertVehicle(env.DB, {
    platform: 'Bolt', externalVehicleId: `plate:${row.vehicle_license_plate}`,
    organizationId: String(companyId), licensePlate: row.vehicle_license_plate,
    model: row.vehicle_model, status: 'active', raw: { source: 'order' },
  });
}

async function syncBoltOrders(env, companyId, startTs, endTs) {
  const rows = await pagedWindows(env, 'getFleetOrders', {
    company_id: companyId, company_ids: [companyId], start_ts: startTs, end_ts: endTs,
    time_range_filter_type: 'price_review',
  }, 'orders', 1000, 'total_orders', 7, (row) => String(row.order_reference || ''));
  let created = 0;
  for (const row of rows) {
    if (!row.order_reference) continue;
    const driverId = await findBoltDriver(env, row, companyId);
    const vehicleId = await findBoltVehicle(env, row, companyId);
    const price = row.order_price || {};
    const campaign = cents(price.campaign_earnings ?? price.campaign_bonus ?? price.bonus ?? 0);
    const reimbursement = cents(price.expense_reimbursement ?? price.reimbursement ?? price.compensation ?? 0);
    const cancellation = cents(price.cancellation_fee ?? 0);
    const bookingFee = cents(price.booking_fee ?? price.reservation_fee ?? 0);
    const tips = cents(price.tip ?? 0);
    const tolls = cents(price.toll_fee ?? price.tolls ?? 0);
    const gross = cents(Number(price.ride_price || 0)) + bookingFee + tolls + cancellation + tips + campaign + reimbursement;
    const net = price.net_earnings == null ? gross - Math.abs(cents(price.commission)) : cents(price.net_earnings);
    const timestamp = row.payment_confirmed_timestamp || row.order_finished_timestamp || row.order_created_timestamp;
    const occurredAt = isoFromUnixSeconds(timestamp);
    const result = await upsertFinancialEntry(env.DB, {
      platform: 'Bolt', externalId: String(row.order_reference), entryType: 'trip', driverId, vehicleId,
      occurredAt, serviceDate: lisbonDate(occurredAt), status: row.order_status,
      tripCount: row.order_status === 'finished' ? 1 : 0, grossCents: gross, netCents: net,
      commissionCents: cents(price.commission), tipCents: tips, tollCents: tolls,
      campaignCents: campaign, reimbursementCents: reimbursement, cancellationCents: cancellation, bookingFeeCents: bookingFee,
      currency: 'EUR', distanceKm: Number(row.ride_distance || 0),
      description: row.category_info?.name || 'Viagem Bolt', raw: row,
    });
    if (result.created) created += 1;
  }
  return { received: rows.length, created, updated: rows.length - created };
}

export async function syncBolt(env, options = {}) {
  if (!env.DB) throw new Error('A base de dados D1 não está ligada ao Worker com o binding DB.');
  const runId = await createSyncRun(env.DB, 'Bolt', options.syncType || 'full');
  try {
    const companyId = Number(options.companyId || await resolveCompanyId(env));
    const orderDays = Number(options.orderLookbackDays || env.SYNC_LOOKBACK_DAYS || 7);
    const entityDays = Number(options.entityLookbackDays || env.BOLT_ENTITY_LOOKBACK_DAYS || 30);
    const orderRange = options.startTs && options.endTs
      ? { startTs: Number(options.startTs), endTs: Number(options.endTs) }
      : rangeSeconds(orderDays);
    const entityRange = options.startTs && options.endTs
      ? { startTs: Number(options.startTs), endTs: Number(options.endTs) }
      : rangeSeconds(entityDays);

    const drivers = await syncBoltDrivers(env, companyId, entityRange.startTs, entityRange.endTs);
    const vehicles = await syncBoltVehicles(env, companyId, entityRange.startTs, entityRange.endTs);
    const orders = await syncBoltOrders(env, companyId, orderRange.startTs, orderRange.endTs);
    const result = {
      companyId, drivers, vehicles, orders,
      received: drivers.received + vehicles.received + orders.received,
      created: drivers.created + vehicles.created + orders.created,
      updated: drivers.updated + vehicles.updated + orders.updated,
    };
    await finishSyncRun(env.DB, runId, result);
    return result;
  } catch (error) {
    await finishSyncRun(env.DB, runId, {}, error);
    throw error;
  }
}


function dateToUnixStart(date) {
  // Meia-noite em Europe/Lisbon, incluindo mudanças entre UTC e horário de verão.
  const utcGuess = new Date(`${date}T00:00:00Z`);
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Lisbon', timeZoneName: 'shortOffset', hour: '2-digit', hour12: false,
  }).formatToParts(utcGuess).find((item) => item.type === 'timeZoneName')?.value || 'GMT';
  const match = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const offsetMinutes = match ? (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] || 0)) : 0;
  return Math.floor((utcGuess.getTime() - offsetMinutes * 60000) / 1000);
}

function addIsoDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function inclusiveDays(startDate, endDate) {
  return Math.floor((new Date(`${endDate}T12:00:00Z`) - new Date(`${startDate}T12:00:00Z`)) / 86400000) + 1;
}

export async function createBoltHistoryJob(env, input = {}) {
  if (!env.DB) throw new Error('A base de dados D1 não está ligada ao Worker com o binding DB.');
  const companyId = Number(input.companyId || await resolveCompanyId(env));
  const startDate = String(input.startDate || '2025-12-30');
  const endDate = String(input.endDate || new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) {
    throw new Error('Intervalo histórico inválido.');
  }
  const chunkDays = Math.min(7, Math.max(1, Number(input.chunkDays || 7)));
  const totalChunks = Math.ceil(inclusiveDays(startDate, endDate) / chunkDays);
  const id = `bolt_hist_${crypto.randomUUID()}`;
  await env.DB.prepare(`INSERT INTO bolt_history_jobs
    (id,company_id,start_date,end_date,next_start_date,status,chunk_days,total_chunks)
    VALUES (?,?,?,?,?,'pending',?,?)`).bind(id, companyId, startDate, endDate, startDate, chunkDays, totalChunks).run();
  return getBoltHistoryJob(env.DB, id);
}

export async function getBoltHistoryJob(db, id = null) {
  if (id) return db.prepare('SELECT * FROM bolt_history_jobs WHERE id=?').bind(id).first();
  return db.prepare('SELECT * FROM bolt_history_jobs ORDER BY created_at DESC LIMIT 1').first();
}

export async function processBoltHistoryJob(env, id = null) {
  const job = await getBoltHistoryJob(env.DB, id);
  if (!job) throw new Error('Não existe uma importação histórica Bolt.');
  if (job.status === 'completed') return job;
  const chunkStart = job.next_start_date;
  const chunkEnd = [addIsoDays(chunkStart, Number(job.chunk_days) - 1), job.end_date].sort()[0];
  await env.DB.prepare("UPDATE bolt_history_jobs SET status='running',last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(job.id).run();
  try {
    // Um bloco por execução: evita limites da Bolt e de subpedidos do Worker.
    const startTs = dateToUnixStart(chunkStart);
    const endTs = dateToUnixStart(addIsoDays(chunkEnd, 1));
    const orders = await syncBoltOrders(env, Number(job.company_id), startTs, endTs);
    const done = chunkEnd >= job.end_date;
    const next = done ? job.end_date : addIsoDays(chunkEnd, 1);
    await env.DB.prepare(`UPDATE bolt_history_jobs SET
      next_start_date=?,status=?,completed_chunks=completed_chunks+1,
      records_received=records_received+?,records_created=records_created+?,records_updated=records_updated+?,
      updated_at=CURRENT_TIMESTAMP,finished_at=? WHERE id=?`).bind(
        next, done ? 'completed' : 'pending', orders.received, orders.created, orders.updated,
        done ? new Date().toISOString() : null, job.id,
      ).run();
    return getBoltHistoryJob(env.DB, job.id);
  } catch (error) {
    const retryable = /TOO_MANY_REQUESTS|too many|429|1005/i.test(String(error.message || error));
    await env.DB.prepare("UPDATE bolt_history_jobs SET status=?,last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(retryable ? 'paused' : 'error', String(error.message || error), job.id).run();
    throw error;
  }
}

export async function resumeBoltHistoryJob(env, id = null) {
  const job = await getBoltHistoryJob(env.DB, id);
  if (!job) throw new Error('Não existe uma importação histórica Bolt.');
  await env.DB.prepare("UPDATE bolt_history_jobs SET status='pending',last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(job.id).run();
  return processBoltHistoryJob(env, job.id);
}
