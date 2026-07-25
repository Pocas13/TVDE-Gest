import {
  createSyncRun, finishSyncRun, fromAmountE5, lisbonDate,
  upsertDriver, upsertFinancialEntry, upsertVehicle, getSetting, setSetting,
} from '../db.js';

const TOKEN_URL = 'https://auth.uber.com/oauth/v2/token';
const API_BASE = 'https://api.uber.com';
const TOKEN_SAFETY_MS = 120000;
let cachedToken = null;
let cachedExpiry = 0;

function required(env, name) {
  const value = env[name];
  if (!value) throw new Error(`Configuração Uber em falta: ${name}.`);
  return value;
}

function requestedScopes(env) {
  const scopes = String(env.UBER_SCOPES || '').trim();
  if (!scopes) {
    throw new Error('A Uber ainda não aprovou scopes para o TVDE Gest. Define UBER_SCOPES apenas depois de os scopes aparecerem como Granted no Developer Dashboard.');
  }
  return scopes;
}

async function uberToken(env, force = false) {
  const now = Date.now();
  if (!force && cachedToken && now < cachedExpiry - TOKEN_SAFETY_MS) return cachedToken;
  const body = new URLSearchParams({
    client_id: required(env, 'UBER_CLIENT_ID'),
    client_secret: required(env, 'UBER_CLIENT_SECRET'),
    grant_type: 'client_credentials',
    scope: requestedScopes(env),
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 400 && detail.includes('invalid_scope')) {
      throw new Error('Scopes Uber ainda não aprovados ou não selecionados. Pede à Uber os scopes Fleet Supplier e, depois de Granted, copia exatamente os nomes para UBER_SCOPES.');
    }
    throw new Error(`Autenticação Uber falhou (${response.status}): ${detail}`);
  }
  const data = await response.json();
  cachedToken = data.access_token;
  cachedExpiry = now + Number(data.expires_in || 3600) * 1000;
  return cachedToken;
}

export async function uberRequest(env, path, { method = 'GET', body = null } = {}, retry = true) {
  const token = await uberToken(env);
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  if (response.status === 401 && retry) {
    await uberToken(env, true);
    return uberRequest(env, path, { method, body }, false);
  }
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const message = data.message || data.error_description || data.error || `Pedido Uber falhou (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

export async function getUberOrganizations(env) {
  const data = await uberRequest(env, '/v1/vehicle-suppliers/orgs');
  return data.organizations || [];
}

async function resolveOrgId(env) {
  const configured = env.UBER_ORG_ID || await getSetting(env.DB, 'uber_org_id');
  if (configured) return configured;
  const orgs = await getUberOrganizations(env);
  if (!orgs.length) throw new Error('A Uber não devolveu organizações autorizadas. Confirma o acesso Fleet Supplier e os scopes.');
  await setSetting(env.DB, 'uber_org_id', orgs[0].id);
  return orgs[0].id;
}

async function syncUberDrivers(env, orgId) {
  let pageToken = '';
  let received = 0;
  let created = 0;
  for (let page = 0; page < 100; page += 1) {
    const query = new URLSearchParams({ org_id: orgId, page_size: '100', include_assigned_vehicles: 'true' });
    if (pageToken) query.set('page_token', pageToken);
    const data = await uberRequest(env, `/v1/vehicle-suppliers/drivers?${query}`);
    const rows = data.driverInformation || [];
    for (const row of rows) {
      let vehicleId = null;
      const assigned = row.assignedVehicles?.[0];
      if (assigned?.vehicleId) {
        const account = await env.DB.prepare(
          'SELECT vehicle_id FROM vehicle_platform_accounts WHERE platform = ? AND (external_vehicle_id = ? OR external_vehicle_id_encrypted = ?)'
        ).bind('Uber', assigned.vehicleId, assigned.vehicleId).first();
        vehicleId = account?.vehicle_id || null;
      }
      const before = await env.DB.prepare(
        'SELECT driver_id FROM driver_platform_accounts WHERE platform = ? AND external_driver_id = ?'
      ).bind('Uber', row.driverId).first();
      await upsertDriver(env.DB, {
        platform: 'Uber', externalDriverId: row.driverId, externalPartnerId: row.driverIdEncrypted,
        organizationId: orgId, name: [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Motorista Uber',
        phone: `${row.phoneNumber?.countryCode || ''}${row.phoneNumber?.number || ''}`,
        email: row.email, status: 'active', platformStatus: 'active', currentVehicleId: vehicleId,
        raw: row,
      });
      if (!before) created += 1;
    }
    received += rows.length;
    pageToken = data.paginationResult?.nextPageToken || '';
    if (!pageToken) break;
  }
  return { received, created, updated: received - created };
}

async function syncUberVehicles(env, orgId) {
  let pageToken = '';
  let received = 0;
  let created = 0;
  for (let page = 0; page < 100; page += 1) {
    const query = new URLSearchParams({ org_id: orgId, page_size: '1000' });
    if (pageToken) query.set('page_token', pageToken);
    const data = await uberRequest(env, `/v2/vehicle-suppliers/vehicles?${query}`);
    const rows = data.vehicleInformation || [];
    for (const row of rows) {
      const before = await env.DB.prepare(
        'SELECT vehicle_id FROM vehicle_platform_accounts WHERE platform = ? AND external_vehicle_id = ?'
      ).bind('Uber', row.vehicleId).first();
      await upsertVehicle(env.DB, {
        platform: 'Uber', externalVehicleId: row.vehicleId,
        externalVehicleIdEncrypted: row.vehicleIdEncrypted, organizationId: orgId,
        licensePlate: row.licensePlate, make: row.make, model: row.model, year: row.year,
        vin: row.vin, color: row.color, status: 'active', platformStatus: 'active', raw: row,
      });
      if (!before) created += 1;
    }
    received += rows.length;
    pageToken = data.paginationResult?.nextPageToken || '';
    if (!pageToken) break;
  }
  return { received, created, updated: received - created };
}

function flattenBreakdown(nodes, map = new Map()) {
  for (const node of nodes || []) {
    if (node?.categoryName && node?.amount) map.set(node.categoryName, node.amount);
    flattenBreakdown(node?.children, map);
  }
  return map;
}

function pickAmount(map, names) {
  for (const name of names) if (map.has(name)) return map.get(name);
  return null;
}

async function syncUberTransactions(env, orgId, startMs, endMs) {
  let pageToken = '';
  let received = 0;
  let created = 0;
  for (let page = 0; page < 200; page += 1) {
    const body = {
      filters: [{ field: 'timeRange', operator: 'FILTER_OPERATOR_IN_RANGE', value: [String(startMs), String(endMs)] }],
      sort: [{ field: 'processedAt', direction: 'DIRECTION_ASCENDING' }],
      pagination_options: { pageSize: 100, pageToken },
    };
    const data = await uberRequest(env, `/v1/vehicle-suppliers/transactions?org_id=${encodeURIComponent(orgId)}`, {
      method: 'POST', body,
    });
    const responseBody = data.body || data;
    const rows = responseBody.transactions || [];
    for (const row of rows) {
      const tx = row.transactionInfo || {};
      if (!tx.transactionUUID) continue;
      const driver = row.driverInfo || {};
      const driverId = driver.driverUUID ? await upsertDriver(env.DB, {
        platform: 'Uber', externalDriverId: driver.driverUUID, organizationId: orgId,
        name: [driver.firstName, driver.lastName].filter(Boolean).join(' ') || 'Motorista Uber',
        status: 'active', raw: driver,
      }) : null;
      const amounts = flattenBreakdown(tx.breakDown || tx.breakdown || []);
      const netAmount = pickAmount(amounts, ['paid_to_you', 'payout', 'net_earnings', 'your_earnings']);
      const grossAmount = pickAmount(amounts, ['your_earnings', 'earnings', 'fare', 'gross_earnings']) || netAmount;
      const tipAmount = pickAmount(amounts, ['tip', 'tips']);
      const tollAmount = pickAmount(amounts, ['toll', 'tolls']);
      const cashAmount = pickAmount(amounts, ['cash_collected', 'cash']);
      const netCents = fromAmountE5(netAmount?.amountE5);
      const grossCents = fromAmountE5(grossAmount?.amountE5);
      const occurredAt = new Date(tx.processedAt || Date.now()).toISOString();
      const result = await upsertFinancialEntry(env.DB, {
        platform: 'Uber', externalId: tx.transactionUUID, entryType: tx.description || 'transaction',
        driverId, occurredAt, serviceDate: lisbonDate(occurredAt), status: 'processed',
        tripCount: tx.tripUUID ? 1 : 0, grossCents, netCents,
        commissionCents: Math.max(0, grossCents - netCents), tipCents: fromAmountE5(tipAmount?.amountE5),
        tollCents: fromAmountE5(tollAmount?.amountE5), cashCollectedCents: fromAmountE5(cashAmount?.amountE5),
        currency: netAmount?.currencyCode || grossAmount?.currencyCode || 'EUR',
        description: tx.description || 'Movimento Uber', raw: row,
      });
      if (result.created) created += 1;
    }
    received += rows.length;
    pageToken = responseBody.paginationResult?.nextPageToken || '';
    if (!pageToken) break;
  }
  return { received, created, updated: received - created };
}

function rangeMs(days) {
  const end = Date.now();
  return { startMs: end - days * 86400000, endMs: end };
}

export async function syncUber(env, options = {}) {
  if (!env.DB) throw new Error('A base de dados D1 não está ligada ao Worker com o binding DB.');
  const runId = await createSyncRun(env.DB, 'Uber', options.syncType || 'full');
  try {
    const orgId = options.orgId || await resolveOrgId(env);
    const days = Number(options.lookbackDays || env.SYNC_LOOKBACK_DAYS || 7);
    const range = options.startMs && options.endMs
      ? { startMs: Number(options.startMs), endMs: Number(options.endMs) }
      : rangeMs(days);
    // Sincroniza primeiro as viaturas para que a associação ativa do motorista
    // possa ser resolvida logo na primeira execução.
    const vehicles = await syncUberVehicles(env, orgId);
    const drivers = await syncUberDrivers(env, orgId);
    const transactions = await syncUberTransactions(env, orgId, range.startMs, range.endMs);
    const result = {
      orgId, drivers, vehicles, transactions,
      received: drivers.received + vehicles.received + transactions.received,
      created: drivers.created + vehicles.created + transactions.created,
      updated: drivers.updated + vehicles.updated + transactions.updated,
    };
    await finishSyncRun(env.DB, runId, result);
    return result;
  } catch (error) {
    await finishSyncRun(env.DB, runId, {}, error);
    throw error;
  }
}
