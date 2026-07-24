/**
 * TVDE Gest — aplicação Cloudflare Worker + painel estático.
 *
 * Secrets obrigatórios no Cloudflare:
 *   BOLT_CLIENT_ID
 *   BOLT_CLIENT_SECRET
 *
 * O painel e a API usam a mesma origem. Nunca coloques segredos no HTML,
 * no GitHub, no wrangler.jsonc ou em variáveis NEXT_PUBLIC/VITE.
 * Protege o domínio do projeto com Cloudflare Access em produção.
 */

const TOKEN_URL = 'https://oidc.bolt.eu/token';
const API_BASE = 'https://node.bolt.eu/fleet-integration-gateway';
const API_PREFIX = '/fleetIntegration/v1';
const TOKEN_SAFETY_WINDOW_MS = 60_000;
const UPSTREAM_TIMEOUT_MS = 20_000;
const MAX_BODY_BYTES = 64 * 1024;

let cachedToken = null;
let cachedTokenExpiry = 0;

const ROUTES = Object.freeze({
  '/api/companies': { method: 'GET', upstream: 'getCompanies', validator: null },
  '/api/getCompanies': { method: 'GET', upstream: 'getCompanies', validator: null },

  '/api/test': { method: 'POST', upstream: 'test', validator: validateTestRequest },
  '/api/orders': { method: 'POST', upstream: 'getFleetOrders', validator: validateOrdersRequest },
  '/api/getFleetOrders': { method: 'POST', upstream: 'getFleetOrders', validator: validateOrdersRequest },
  '/api/state-logs': { method: 'POST', upstream: 'getFleetStateLogs', validator: validateCompanyPageRequest },
  '/api/getFleetStateLogs': { method: 'POST', upstream: 'getFleetStateLogs', validator: validateCompanyPageRequest },
  '/api/drivers': { method: 'POST', upstream: 'getDrivers', validator: validateDriversRequest },
  '/api/getDrivers': { method: 'POST', upstream: 'getDrivers', validator: validateDriversRequest },
  '/api/vehicles': { method: 'POST', upstream: 'getVehicles', validator: validateVehiclesRequest },
  '/api/getVehicles': { method: 'POST', upstream: 'getVehicles', validator: validateVehiclesRequest },
});

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      ...extraHeaders,
    },
  });
}

function parseBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = allowedOrigins(env);
  const allowNoOrigin = parseBoolean(env.ALLOW_NO_ORIGIN, false);

  if (!origin) {
    if (!allowNoOrigin) {
      return { ok: false, headers: {}, reason: 'Pedidos sem Origin não são permitidos.' };
    }
    return {
      ok: true,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
        Vary: 'Origin',
      },
    };
  }

  const normalized = origin.replace(/\/$/, '');
  if (!allowed.length || !allowed.includes(normalized)) {
    return { ok: false, headers: {}, reason: 'Origem não autorizada.' };
  }

  return {
    ok: true,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
      Vary: 'Origin',
    },
  };
}

function validateEnvironment(env) {
  const missing = [];
  if (!env.BOLT_CLIENT_ID) missing.push('BOLT_CLIENT_ID');
  if (!env.BOLT_CLIENT_SECRET) missing.push('BOLT_CLIENT_SECRET');
  if (missing.length) {
    throw new HttpError(500, 'CONFIGURATION_ERROR', `Secrets em falta no Cloudflare: ${missing.join(', ')}.`);
  }
}

function assertSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    throw new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Pedido proveniente de outra origem não autorizado.');
  }
}

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function requireObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'INVALID_JSON_BODY', 'O corpo do pedido deve ser um objeto JSON.');
  }
  return { ...value };
}

function requireInteger(body, field, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  const value = body[field];
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(400, 'INVALID_FIELD', `O campo ${field} deve ser um número inteiro entre ${min} e ${max}.`);
  }
}

function requireCompanyId(body) {
  requireInteger(body, 'company_id', { min: 1 });
}

function requireTimeRange(body) {
  requireInteger(body, 'start_ts', { min: 1 });
  requireInteger(body, 'end_ts', { min: 1 });
  if (body.start_ts >= body.end_ts) {
    throw new HttpError(400, 'INVALID_DATE_RANGE', 'start_ts tem de ser anterior a end_ts.');
  }
}

function requirePager(body, maxLimit) {
  requireInteger(body, 'offset', { min: 0 });
  requireInteger(body, 'limit', { min: 1, max: maxLimit });
}

function validateOptionalFilters(body) {
  if (body.portal_status != null && !['active', 'blocked', 'deactivated'].includes(body.portal_status)) {
    throw new HttpError(400, 'INVALID_PORTAL_STATUS', 'portal_status deve ser active, blocked ou deactivated.');
  }
  if (body.search != null) {
    if (typeof body.search !== 'string' || body.search.length < 1 || body.search.length > 255) {
      throw new HttpError(400, 'INVALID_SEARCH', 'search deve ter entre 1 e 255 caracteres.');
    }
  }
}

function normalizeCompanyIds(body) {
  if (body.company_id != null && body.company_ids == null) {
    body.company_ids = [body.company_id];
  }
  if (!Array.isArray(body.company_ids) || body.company_ids.length === 0) {
    throw new HttpError(400, 'INVALID_COMPANY_IDS', 'company_ids deve ser uma lista com pelo menos um company_id.');
  }
  if (!body.company_ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw new HttpError(400, 'INVALID_COMPANY_IDS', 'Todos os valores de company_ids devem ser números inteiros positivos.');
  }
  return body;
}

function validateTestRequest(input) {
  const body = normalizeCompanyIds(requireObject(input));
  requirePager(body, 1000);
  requireTimeRange(body);
  return body;
}

function validateOrdersRequest(input) {
  const body = normalizeCompanyIds(requireObject(input));
  requirePager(body, 1000);
  requireTimeRange(body);
  if (body.company_id != null) requireInteger(body, 'company_id', { min: 1 });
  if (body.time_range_filter_type != null && !['price_review', 'created'].includes(body.time_range_filter_type)) {
    throw new HttpError(400, 'INVALID_TIME_FILTER', 'time_range_filter_type deve ser price_review ou created.');
  }
  return body;
}

function validateCompanyPageRequest(input) {
  const body = requireObject(input);
  requireCompanyId(body);
  requirePager(body, 1000);
  requireTimeRange(body);
  return body;
}

function validateDriversRequest(input) {
  const body = validateCompanyPageRequest(input);
  validateOptionalFilters(body);
  return body;
}

function validateVehiclesRequest(input) {
  const body = requireObject(input);
  requireCompanyId(body);
  requirePager(body, 100);
  requireTimeRange(body);
  validateOptionalFilters(body);
  return body;
}

async function readJsonBody(request) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    throw new HttpError(413, 'BODY_TOO_LARGE', 'O corpo do pedido excede o limite permitido.');
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Usa Content-Type: application/json.');
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new HttpError(413, 'BODY_TOO_LARGE', 'O corpo do pedido excede o limite permitido.');
  }

  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'O corpo contém JSON inválido.');
  }
}

async function fetchWithTimeout(url, init, timeoutMs = UPSTREAM_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new HttpError(504, 'UPSTREAM_TIMEOUT', 'A Bolt demorou demasiado tempo a responder.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function getAccessToken(env, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedToken && now < cachedTokenExpiry - TOKEN_SAFETY_WINDOW_MS) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    client_id: env.BOLT_CLIENT_ID,
    client_secret: env.BOLT_CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'fleet-integration:api',
  });

  const response = await fetchWithTimeout(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!response.ok || !data?.access_token || !Number.isFinite(Number(data.expires_in))) {
    cachedToken = null;
    cachedTokenExpiry = 0;
    throw new HttpError(
      502,
      'BOLT_AUTH_FAILED',
      'Não foi possível autenticar na Bolt.',
      { upstream_status: response.status, upstream_response: data || text.slice(0, 500) },
    );
  }

  cachedToken = data.access_token;
  cachedTokenExpiry = now + Number(data.expires_in) * 1000;
  return cachedToken;
}

async function callBolt(upstreamEndpoint, body, env, retryAuth = true) {
  const token = await getAccessToken(env);
  const isGet = upstreamEndpoint === 'getCompanies';

  const response = await fetchWithTimeout(`${API_BASE}${API_PREFIX}/${upstreamEndpoint}`, {
    method: isGet ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(isGet ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(isGet ? {} : { body: JSON.stringify(body) }),
  });

  if (response.status === 401 && retryAuth) {
    cachedToken = null;
    cachedTokenExpiry = 0;
    await getAccessToken(env, true);
    return callBolt(upstreamEndpoint, body, env, false);
  }

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { code: response.status, message: text || 'Resposta não JSON recebida da Bolt.' };
  }

  if (!response.ok) {
    throw new HttpError(
      response.status >= 500 ? 502 : response.status,
      'BOLT_API_ERROR',
      payload?.message || `A Bolt devolveu o estado HTTP ${response.status}.`,
      { upstream_status: response.status, upstream_response: payload },
    );
  }

  return payload;
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-Frame-Options', 'DENY');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return withSecurityHeaders(await env.ASSETS.fetch(request));
    }

    try {
      assertSameOrigin(request);

      if (url.pathname === '/api/health') {
        return jsonResponse({
          ok: true,
          service: 'tvde-gest',
          bolt_credentials_configured: Boolean(env.BOLT_CLIENT_ID && env.BOLT_CLIENT_SECRET),
          request_id: requestId,
        });
      }

      validateEnvironment(env);

      if (url.pathname === '/api/test-connection') {
        if (request.method !== 'GET') {
          throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Este endpoint aceita apenas GET.');
        }
        await getAccessToken(env);
        return jsonResponse({
          ok: true,
          service: 'tvde-gest',
          message: 'Autenticação com a Bolt estabelecida com sucesso.',
          request_id: requestId,
        });
      }

      const route = ROUTES[url.pathname];
      if (!route) throw new HttpError(404, 'NOT_FOUND', 'Endpoint não encontrado.');
      if (request.method !== route.method) {
        throw new HttpError(405, 'METHOD_NOT_ALLOWED', `Este endpoint aceita apenas ${route.method}.`);
      }

      let body = null;
      if (route.method === 'POST') {
        const rawBody = await readJsonBody(request);
        body = route.validator(rawBody);
      }

      const data = await callBolt(route.upstream, body, env);
      return jsonResponse(data, 200, { 'X-Request-Id': requestId });
    } catch (error) {
      const isHttpError = error instanceof HttpError;
      const status = isHttpError ? error.status : 500;
      const payload = {
        ok: false,
        error: {
          code: isHttpError ? error.code : 'INTERNAL_ERROR',
          message: isHttpError ? error.message : 'Erro interno na integração Bolt.',
          ...(isHttpError && error.details ? { details: error.details } : {}),
        },
        request_id: requestId,
      };
      if (!isHttpError) console.error('Unhandled error', requestId, error);
      return jsonResponse(payload, status, { 'X-Request-Id': requestId });
    }
  },
};
