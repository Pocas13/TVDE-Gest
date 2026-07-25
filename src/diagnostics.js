import { getSetting } from './db.js';

async function count(db, table) {
  try { return Number((await db.prepare(`SELECT COUNT(*) total FROM ${table}`).first())?.total || 0); }
  catch { return null; }
}

export async function diagnostics(env) {
  const checks = [];
  checks.push({ key: 'worker', label: 'Cloudflare Worker', ok: true, detail: 'API operacional' });
  checks.push({ key: 'assets', label: 'Recursos do painel', ok: Boolean(env.ASSETS), detail: env.ASSETS ? 'Binding ASSETS ligado' : 'Binding ASSETS em falta' });
  checks.push({ key: 'd1', label: 'Base de dados D1', ok: Boolean(env.DB), detail: env.DB ? 'Binding DB ligado' : 'Binding DB em falta' });
  checks.push({ key: 'bolt', label: 'Credenciais Bolt', ok: Boolean(env.BOLT_CLIENT_ID && env.BOLT_CLIENT_SECRET), detail: env.BOLT_CLIENT_ID && env.BOLT_CLIENT_SECRET ? 'Configuradas' : 'Não configuradas' });
  checks.push({ key: 'uber', label: 'Credenciais Uber', ok: Boolean(env.UBER_CLIENT_ID && env.UBER_CLIENT_SECRET), detail: env.UBER_CLIENT_ID && env.UBER_CLIENT_SECRET ? 'Configuradas' : 'Não configuradas' });
  const metrics = env.DB ? {
    drivers: await count(env.DB, 'drivers'), vehicles: await count(env.DB, 'vehicles'),
    detailedEntries: await count(env.DB, 'financial_entries'), aggregatePeriods: await count(env.DB, 'aggregate_driver_periods'),
    activityPeriods: await count(env.DB, 'activity_driver_periods'), imports: await count(env.DB, 'import_batches'),
  } : {};
  const lastSync = env.DB ? await env.DB.prepare('SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1').first().catch(() => null) : null;
  const lastImport = env.DB ? await env.DB.prepare('SELECT * FROM import_batches ORDER BY created_at DESC LIMIT 1').first().catch(() => null) : null;
  return {
    ok: checks.every((item) => item.ok || ['bolt','uber'].includes(item.key)),
    checks, metrics, lastSync, lastImport,
    productMode: env.DB ? await getSetting(env.DB, 'product_mode', 'internal') : 'unknown',
    now: new Date().toISOString(),
  };
}
