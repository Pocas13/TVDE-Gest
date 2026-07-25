/**
 * TVDE Gest — Cloudflare Worker, D1, Bolt e Uber.
 * Protege o domínio com Cloudflare Access em produção.
 */
import { snapshot, getSetting, setSetting, upsertDriver, upsertVehicle, upsertFinancialEntry } from './db.js';
import { boltRequest, getBoltCompanyIds, syncBolt } from './platforms/bolt.js';
import { getUberOrganizations, syncUber } from './platforms/uber.js';
import {
  addSettlementAdjustment, calculateSettlements, listSettlementRules,
  listSettlements, previousMonday, upsertSettlementRule,
} from './settlements.js';
import { audit, deletePlatformData, listAuditLogs, listConsents, retentionCleanup, upsertConsent } from './compliance.js';

class HttpError extends Error {
  constructor(status, code, message) {
    super(message); this.status = status; this.code = code;
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  });
}

function assertAccess(request, env) {
  if (String(env.REQUIRE_CF_ACCESS || '').toLowerCase() !== 'true') return;
  const email = request.headers.get('CF-Access-Authenticated-User-Email');
  if (!email) throw new HttpError(401, 'ACCESS_REQUIRED', 'Acesso protegido pelo Cloudflare Access obrigatório.');
}

function assertSameOrigin(request) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    throw new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Pedido de outra origem não autorizado.');
  }
}

function requireDb(env) {
  if (!env.DB) throw new HttpError(503, 'D1_NOT_CONFIGURED', 'Liga uma base de dados D1 ao binding DB.');
}

async function bodyJson(request) {
  if (request.method === 'GET') return {};
  const text = await request.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'INVALID_JSON', 'JSON inválido.'); }
}

function legacySnapshot(data) {
  return {
    drivers: data.drivers.map((row) => ({
      id: row.id, nome: row.name, contacto: row.phone || '', email: row.email || '',
      vehicleId: row.current_vehicle_id || '', plataformas: row.platforms ? row.platforms.split(',') : [],
      licenca: row.tvde_license || '', estado: row.status,
    })),
    vehicles: data.vehicles.map((row) => ({
      id: row.id, matricula: row.license_plate,
      modelo: [row.make, row.model].filter(Boolean).join(' ') || '', ano: row.year || '',
      driverId: row.current_driver_id || '', estado: row.status === 'active' ? 'Ativo' : 'Parado',
      vin: row.vin || '', lugares: row.seats || '',
    })),
    entries: data.entries.map((row) => ({
      id: row.id, externalId: row.external_id, data: row.service_date, plataforma: row.platform,
      driverId: row.driver_id || '', vehicleId: row.vehicle_id || '', viagens: row.trip_count,
      horas: row.hours_online, bruto: row.gross_cents / 100,
      despesas: Math.max(0, row.gross_cents - row.net_cents) / 100,
      liquido: row.net_cents / 100, commission: row.commission_cents / 100,
      tip: row.tip_cents / 100, tollFee: row.toll_cents / 100,
      status: row.status || '', distance: row.distance_km,
      source: `${row.platform} API`, updatedAt: row.updated_at,
    })),
    syncRuns: data.syncRuns,
  };
}

async function importLocalSnapshot(env, input) {
  let drivers = 0, vehicles = 0, entries = 0;
  const driverMap = new Map();
  const vehicleMap = new Map();

  for (const item of input.drivers || []) {
    const driverId = await upsertDriver(env.DB, {
      platform: null, name: item.nome, phone: item.contacto, email: item.email,
      tvdeLicense: item.licenca, status: item.estado || 'active',
    });
    if (item.id) driverMap.set(item.id, driverId);
    drivers += 1;
  }
  for (const item of input.vehicles || []) {
    const vehicleId = await upsertVehicle(env.DB, {
      platform: null, licensePlate: item.matricula, model: item.modelo,
      year: Number(item.ano) || null, vin: item.vin, seats: Number(item.lugares) || null,
      status: item.estado === 'Ativo' ? 'active' : 'inactive',
      currentDriverId: driverMap.get(item.driverId) || null,
    });
    if (item.id && vehicleId) vehicleMap.set(item.id, vehicleId);
    vehicles += 1;
  }
  for (const item of input.entries || []) {
    const externalId = item.externalId || `local:${item.id || crypto.randomUUID()}`;
    await upsertFinancialEntry(env.DB, {
      platform: item.plataforma === 'Uber' ? 'Uber' : item.plataforma === 'Bolt' ? 'Bolt' : 'Manual',
      externalId, entryType: 'manual_import',
      driverId: driverMap.get(item.driverId) || null,
      vehicleId: vehicleMap.get(item.vehicleId) || null,
      occurredAt: `${item.data}T12:00:00.000Z`, serviceDate: item.data,
      tripCount: Number(item.viagens || 0), hoursOnline: Number(item.horas || 0),
      grossCents: Math.round(Number(item.bruto || 0) * 100),
      netCents: Math.round(Number(item.liquido ?? (Number(item.bruto || 0) - Number(item.despesas || 0))) * 100),
      commissionCents: Math.round(Number(item.commission || 0) * 100),
      tipCents: Math.round(Number(item.tip || 0) * 100),
      tollCents: Math.round(Number(item.tollFee || 0) * 100),
      currency: 'EUR', description: 'Importação local', raw: item,
    });
    entries += 1;
  }
  return { drivers, vehicles, entries };
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const isUberWebhook = path === '/api/webhooks/uber';
  if (!isUberWebhook) {
    assertAccess(request, env);
    assertSameOrigin(request);
  }


  if (path === '/api/webhooks/uber' && request.method === 'POST') {
    requireDb(env);
    const raw = await request.text();
    const provided = request.headers.get('X-Uber-Signature') || '';
    if (!env.UBER_CLIENT_SECRET) throw new HttpError(503, 'UBER_NOT_CONFIGURED', 'Segredo Uber não configurado.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.UBER_CLIENT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
    const expected = [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (!provided || provided.toLowerCase() !== expected.toLowerCase()) {
      throw new HttpError(401, 'INVALID_UBER_SIGNATURE', 'Assinatura Uber inválida.');
    }
    const payload = raw ? JSON.parse(raw) : {};
    const eventId = payload.event_id || payload.eventId || crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO webhook_events (id, platform, event_type, event_time, environment, signature_valid, payload_json, processed_at)
      VALUES (?, 'Uber', ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO NOTHING
    `).bind(eventId, payload.event_type || payload.eventType || null, payload.event_time || payload.eventTime || null,
      request.headers.get('X-Environment') || null, JSON.stringify(payload)).run();
    return new Response(null, { status: 200 });
  }

  if (path === '/api/health') {
    return json({ ok: true, app: 'TVDE Gest', d1: Boolean(env.DB), bolt: Boolean(env.BOLT_CLIENT_ID && env.BOLT_CLIENT_SECRET), uber: Boolean(env.UBER_CLIENT_ID && env.UBER_CLIENT_SECRET) });
  }

  if (path === '/api/companies' || path === '/api/getCompanies') {
    return json(await boltRequest(env, 'getCompanies'));
  }
  const boltRoutes = {
    '/api/test': 'test', '/api/orders': 'getFleetOrders', '/api/getFleetOrders': 'getFleetOrders',
    '/api/state-logs': 'getFleetStateLogs', '/api/getFleetStateLogs': 'getFleetStateLogs',
    '/api/drivers': 'getDrivers', '/api/getDrivers': 'getDrivers',
    '/api/vehicles': 'getVehicles', '/api/getVehicles': 'getVehicles',
  };
  if (boltRoutes[path]) {
    if (request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Usa POST.');
    return json(await boltRequest(env, boltRoutes[path], { method: 'POST', body: await bodyJson(request) }));
  }

  requireDb(env);

  if (path === '/api/data/snapshot' && request.method === 'GET') {
    return json({ ok: true, ...legacySnapshot(await snapshot(env.DB)) });
  }
  if (path === '/api/data/import-local' && request.method === 'POST') {
    return json({ ok: true, imported: await importLocalSnapshot(env, await bodyJson(request)) });
  }

  if (path === '/api/integrations/status' && request.method === 'GET') {
    const boltIds = env.BOLT_CLIENT_ID && env.BOLT_CLIENT_SECRET ? await getBoltCompanyIds(env).catch(() => []) : [];
    const uberOrgs = env.UBER_CLIENT_ID && env.UBER_CLIENT_SECRET ? await getUberOrganizations(env).catch(() => []) : [];
    return json({
      ok: true,
      bolt: { configured: Boolean(env.BOLT_CLIENT_ID && env.BOLT_CLIENT_SECRET), companyIds: boltIds },
      uber: { configured: Boolean(env.UBER_CLIENT_ID && env.UBER_CLIENT_SECRET), organizations: uberOrgs },
    });
  }

  if (path === '/api/settings/platform' && request.method === 'POST') {
    const input = await bodyJson(request);
    if (input.boltCompanyId) await setSetting(env.DB, 'bolt_company_id', input.boltCompanyId);
    if (input.uberOrgId) await setSetting(env.DB, 'uber_org_id', input.uberOrgId);
    return json({ ok: true });
  }

  if (path === '/api/sync/bolt' && request.method === 'POST') {
    return json({ ok: true, result: await syncBolt(env, await bodyJson(request)) });
  }
  if (path === '/api/sync/uber' && request.method === 'POST') {
    return json({ ok: true, result: await syncUber(env, await bodyJson(request)) });
  }
  if (path === '/api/sync/all' && request.method === 'POST') {
    const input = await bodyJson(request);
    const result = {};
    if (env.BOLT_CLIENT_ID && env.BOLT_CLIENT_SECRET) result.bolt = await syncBolt(env, input.bolt || {});
    if (env.UBER_CLIENT_ID && env.UBER_CLIENT_SECRET) result.uber = await syncUber(env, input.uber || {});
    return json({ ok: true, result });
  }


  if (path === '/api/compliance/consents' && request.method === 'GET') {
    return json({ ok: true, consents: await listConsents(env.DB) });
  }
  if (path === '/api/compliance/consents' && request.method === 'POST') {
    const input = await bodyJson(request);
    const result = await upsertConsent(env.DB, input);
    await audit(env.DB, { actorEmail: request.headers.get('CF-Access-Authenticated-User-Email'), action: 'consent.updated', resourceType: 'driver', resourceId: input.driverId, platform: input.platform });
    return json({ ok: true, result });
  }
  if (path === '/api/compliance/audit' && request.method === 'GET') {
    return json({ ok: true, logs: await listAuditLogs(env.DB, url.searchParams.get('limit')) });
  }
  if (path === '/api/compliance/delete-platform-data' && request.method === 'POST') {
    const input = await bodyJson(request);
    const result = await deletePlatformData(env.DB, input);
    await audit(env.DB, { actorEmail: request.headers.get('CF-Access-Authenticated-User-Email'), action: 'platform_data.deleted', resourceType: input.driverId ? 'driver' : 'platform', resourceId: input.driverId || input.platform, platform: input.platform });
    return json({ ok: true, result });
  }
  if (path === '/api/compliance/settings' && request.method === 'GET') {
    return json({ ok: true, settings: {
      privacyPolicyVersion: await getSetting(env.DB, 'privacy_policy_version', '2026-07-25'),
      uberCombinedProcessingAuthorized: (await getSetting(env.DB, 'uber_combined_processing_authorized', 'false')) === 'true',
      uberRetentionDays: Number(await getSetting(env.DB, 'uber_retention_days', '90')),
    }});
  }
  if (path === '/api/compliance/settings' && request.method === 'POST') {
    const input = await bodyJson(request);
    if (typeof input.uberCombinedProcessingAuthorized === 'boolean') await setSetting(env.DB, 'uber_combined_processing_authorized', String(input.uberCombinedProcessingAuthorized));
    if (input.uberRetentionDays) await setSetting(env.DB, 'uber_retention_days', String(Math.max(1, Number(input.uberRetentionDays))));
    await audit(env.DB, { actorEmail: request.headers.get('CF-Access-Authenticated-User-Email'), action: 'compliance.settings.updated', resourceType: 'settings', details: input });
    return json({ ok: true });
  }

  if (path === '/api/settlement-rules' && request.method === 'GET') {
    return json({ ok: true, rules: await listSettlementRules(env.DB) });
  }
  if (path === '/api/settlement-rules' && request.method === 'POST') {
    return json({ ok: true, rule: await upsertSettlementRule(env.DB, await bodyJson(request)) });
  }
  if (path === '/api/settlement-adjustments' && request.method === 'POST') {
    return json({ ok: true, adjustment: await addSettlementAdjustment(env.DB, await bodyJson(request)) });
  }
  if (path === '/api/settlements/calculate' && request.method === 'POST') {
    const input = await bodyJson(request);
    const combinedAuthorized = (await getSetting(env.DB, 'uber_combined_processing_authorized', 'false')) === 'true';
    if (!combinedAuthorized) {
      const rules = await listSettlementRules(env.DB);
      if (rules.some((rule) => Number(rule.active) === 1 && Number(rule.include_bolt) === 1 && Number(rule.include_uber) === 1)) {
        throw new HttpError(409, 'UBER_COMBINED_PROCESSING_NOT_AUTHORIZED', 'Os acertos combinados Uber/Bolt estão bloqueados até existir autorização escrita da Uber.');
      }
    }
    const weekStart = input.weekStart || previousMonday();
    const result = await calculateSettlements(env.DB, weekStart);
    await audit(env.DB, { actorEmail: request.headers.get('CF-Access-Authenticated-User-Email'), action: 'settlements.calculated', resourceType: 'week', resourceId: weekStart });
    return json({ ok: true, weekStart, settlements: result });
  }
  if (path === '/api/settlements' && request.method === 'GET') {
    const weekStart = url.searchParams.get('week_start') || previousMonday();
    return json({ ok: true, weekStart, settlements: await listSettlements(env.DB, weekStart) });
  }

  throw new HttpError(404, 'NOT_FOUND', 'Endpoint não encontrado.');
}

async function scheduledSync(env, controller) {
  requireDb(env);
  const retentionDays = Number(await getSetting(env.DB, 'uber_retention_days', '90'));
  await retentionCleanup(env.DB, 'Uber', retentionDays);
  if (controller.cron === '30 5 * * MON') {
    const weekStart = previousMonday(new Date(controller.scheduledTime));
    return { type: 'weekly_settlements', weekStart, result: await calculateSettlements(env.DB, weekStart) };
  }
  const result = {};
  if (env.BOLT_CLIENT_ID && env.BOLT_CLIENT_SECRET) result.bolt = await syncBolt(env, { syncType: 'scheduled' });
  if (env.UBER_CLIENT_ID && env.UBER_CLIENT_SECRET) result.uber = await syncUber(env, { syncType: 'scheduled' });
  return { type: 'platform_sync', result };
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return json({ ok: false, code: error.code || 'INTERNAL_ERROR', error: error.message || 'Erro interno.' }, error.status || 500);
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(scheduledSync(env, controller).then((result) => console.log('Scheduled OK', result)).catch((error) => console.error('Scheduled error', error)));
  },
};
