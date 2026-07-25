import { cents, uid, upsertDriver } from './db.js';

const ORG_ID = 'org_daniel_sc';

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}


function canonicalDriverName(value) {
  const key = normalize(value).replace(/\s+/g, ' ');
  const aliases = {
    'daniel jose santos silva': 'Daniel Silva',
    'tiago alexandre ferreira pinto': 'Tiago Pinto',
    'joel assuncao': 'Joel Assunção',
    'marcelo de almeida gomes': 'Marcelo Gomes',
    'viviana soares reis': 'Viviana Reis',
    'julio jardim': 'Júlio Jardim',
    'anubis ribeiro': 'Anúbis Ribeiro',
  };
  return aliases[key] || String(value || '').trim();
}

async function existingDriverByName(db, name) {
  return db.prepare('SELECT id FROM drivers WHERE LOWER(name)=LOWER(?) LIMIT 1').bind(name).first();
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const headers = (rows.shift() || []).map((item) => item.trim());
  return rows.filter((items) => items.some((item) => String(item).trim())).map((items) =>
    Object.fromEntries(headers.map((header, index) => [header, items[index] ?? ''])));
}

function findValue(row, candidates) {
  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const wanted = normalize(candidate);
    const found = entries.find(([key]) => normalize(key) === wanted);
    if (found) return found[1];
  }
  return '';
}

function number(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '').trim().replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.').replace(/[^0-9+-.]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function durationHours(value) {
  const parts = String(value || '').split(':').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return 0;
  return parts[0] * 24 + parts[1] + parts[2] / 60;
}

function inferPeriod(fileName) {
  const name = normalize(fileName);
  const iso = [...name.matchAll(/(20\d{2})[-_](\d{2})[-_](\d{2})/g)].map((match) => `${match[1]}-${match[2]}-${match[3]}`);
  if (iso.length >= 2) return { start: iso[0], end: iso[1] };
  return null;
}

function detectType(rows) {
  const keys = Object.keys(rows[0] || {}).map(normalize);
  if (keys.some((key) => key.includes('ganhos liquidos')) && keys.some((key) => key.includes('motorista'))) return 'bolt_earnings';
  if (keys.some((key) => key.includes('uuid do motorista')) && keys.some((key) => key.includes('tempo online'))) return 'uber_activity';
  throw new Error('Formato CSV não reconhecido. Usa um relatório Bolt de ganhos ou Uber de atividade dos motoristas.');
}

async function batchRecord(db, input, counts) {
  const id = uid('imp_');
  await db.prepare(`INSERT INTO import_batches
    (id,organization_id,platform,import_type,source_name,period_start,period_end,status,rows_received,rows_imported,rows_updated,details_json)
    VALUES (?,?,?,?,?,?,?,'completed',?,?,?,?)`).bind(
      id, ORG_ID, input.platform, input.type, input.fileName || 'CSV', input.periodStart, input.periodEnd,
      counts.received, counts.created, counts.updated, JSON.stringify({ detectedType: input.type }),
    ).run();
  return id;
}

async function importBolt(db, rows, input) {
  let created = 0, updated = 0;
  for (const row of rows) {
    const externalDriverId = String(findValue(row, ['Identificador do motorista']) || '').trim();
    const name = canonicalDriverName(String(findValue(row, ['Motorista']) || 'Motorista Bolt').trim());
    const existingDriver = await existingDriverByName(db, name);
    const driverId = await upsertDriver(db, {
      driverId: existingDriver?.id || null,
      platform: 'Bolt', externalDriverId: externalDriverId || `csv:${normalize(name)}`,
      externalPartnerId: findValue(row, ['Identificador individual']) || null,
      name, phone: findValue(row, ['Telemóvel']), email: findValue(row, ['Email']),
      status: 'active', platformStatus: 'historical', raw: { source: input.fileName },
    });
    const externalId = `${externalDriverId || normalize(name)}:${input.fileName}:${input.periodStart}:${input.periodEnd}`;
    const existing = await db.prepare(`SELECT id FROM aggregate_driver_periods
      WHERE platform='Bolt' AND external_id=? AND period_start=? AND period_end=?`).bind(externalId, input.periodStart, input.periodEnd).first();
    const id = existing?.id || uid('agg_');
    await db.prepare(`INSERT INTO aggregate_driver_periods
      (id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,
       gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,
       cancellation_cents,booking_fee_cents,trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
       driver_id=excluded.driver_id,source_name=excluded.source_name,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,
       commission_cents=excluded.commission_cents,tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,
       campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,cancellation_cents=excluded.cancellation_cents,
       booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
       distance_km=excluded.distance_km,acceptance_rate=excluded.acceptance_rate,utilization_rate=excluded.utilization_rate,
       completion_rate=excluded.completion_rate,rating=excluded.rating,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP`).bind(
        id, ORG_ID, 'Bolt', driverId, externalId, input.fileName, input.periodStart, input.periodEnd,
        cents(number(findValue(row, ['Ganhos brutos (total)|€']))), cents(number(findValue(row, ['Ganhos líquidos|€']))),
        cents(number(findValue(row, ['Comissões|€']))), cents(number(findValue(row, ['Gorjetas dos passageiros|€']))),
        cents(number(findValue(row, ['Portagens|€']))), cents(number(findValue(row, ['Ganhos da campanha|€']))),
        cents(number(findValue(row, ['Reembolsos de despesas|€']))), cents(number(findValue(row, ['Taxas de cancelamento|€']))),
        cents(number(findValue(row, ['Taxas de reserva|€']))), Math.round(number(findValue(row, ['Viagens terminadas']))),
        number(findValue(row, ['Tempo online (min)'])) / 60, number(findValue(row, ['Distância total das viagens|km'])),
        number(findValue(row, ['Taxa de aceitação total|%'])) || null, number(findValue(row, ['Utilização|%'])) || null,
        number(findValue(row, ['Taxa de finalização (todas as viagens)|%'])) || null,
        number(findValue(row, ['Classificação média do motorista|★'])) || null, JSON.stringify(row),
      ).run();
    if (existing) updated += 1; else created += 1;
  }
  return { received: rows.length, created, updated };
}

async function importUberActivity(db, rows, input) {
  let created = 0, updated = 0;
  for (const row of rows) {
    const externalDriverId = String(findValue(row, ['UUID do motorista']) || '').trim();
    const name = canonicalDriverName([findValue(row, ['Nome próprio do motorista']), findValue(row, ['Apelido do motorista'])].filter(Boolean).join(' ').trim() || 'Motorista Uber');
    const existingDriver = await existingDriverByName(db, name);
    const driverId = await upsertDriver(db, {
      driverId: existingDriver?.id || null,
      platform: 'Uber', externalDriverId: externalDriverId || `csv:${normalize(name)}`,
      name, status: 'active', platformStatus: 'active', raw: { source: input.fileName },
    });
    const externalId = `${externalDriverId || normalize(name)}:${input.fileName}:${input.periodStart}:${input.periodEnd}`;
    const existing = await db.prepare(`SELECT id FROM activity_driver_periods
      WHERE platform='Uber' AND external_id=? AND period_start=? AND period_end=?`).bind(externalId, input.periodStart, input.periodEnd).first();
    const id = existing?.id || uid('act_');
    await db.prepare(`INSERT INTO activity_driver_periods
      (id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,trip_count,hours_online,hours_on_trip,raw_json,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
       driver_id=excluded.driver_id,source_name=excluded.source_name,trip_count=excluded.trip_count,
       hours_online=excluded.hours_online,hours_on_trip=excluded.hours_on_trip,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP`).bind(
        id, ORG_ID, 'Uber', driverId, externalId, input.fileName, input.periodStart, input.periodEnd,
        Math.round(number(findValue(row, ['Viagens concluídas']))),
        durationHours(findValue(row, ['Tempo online (dias: horas: minutos)'])),
        durationHours(findValue(row, ['Tempo em viagem (dias: horas: minutos)'])), JSON.stringify(row),
      ).run();
    if (existing) updated += 1; else created += 1;
  }
  return { received: rows.length, created, updated };
}

export async function importCsv(env, payload = {}) {
  if (!payload.content) throw new Error('O conteúdo do CSV está vazio.');
  const rows = parseCsv(payload.content);
  if (!rows.length) throw new Error('O CSV não contém linhas de dados.');
  const type = payload.type && payload.type !== 'auto' ? payload.type : detectType(rows);
  const inferred = inferPeriod(payload.fileName || '');
  const periodStart = payload.periodStart || inferred?.start;
  const periodEnd = payload.periodEnd || inferred?.end;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart || '') || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd || '') || periodStart > periodEnd) {
    throw new Error('Indica o início e o fim do período do relatório.');
  }
  const input = { type, platform: type.startsWith('bolt') ? 'Bolt' : 'Uber', fileName: payload.fileName || 'CSV', periodStart, periodEnd };
  const result = type === 'bolt_earnings' ? await importBolt(env.DB, rows, input) : await importUberActivity(env.DB, rows, input);
  const batchId = await batchRecord(env.DB, input, result);
  return { ...result, batchId, detectedType: type, periodStart, periodEnd };
}

export async function listImports(db, limit = 50) {
  const result = await db.prepare(`SELECT * FROM import_batches ORDER BY created_at DESC LIMIT ?`).bind(Math.min(200, Math.max(1, Number(limit) || 50))).all();
  return result.results || [];
}
