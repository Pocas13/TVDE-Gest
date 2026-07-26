import { uid } from './db.js';
import { driverMirror } from './analytics.js';

const ORG_ID = 'org_daniel_sc';

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createDriverPortalLink(db, driverId, origin, days = 30) {
  const driver = await db.prepare('SELECT id,name FROM drivers WHERE id=?').bind(driverId).first();
  if (!driver) throw new Error('Motorista não encontrado.');
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
  const expires = new Date(Date.now() + Math.min(180, Math.max(1, Number(days) || 30)) * 86400000).toISOString();
  await db.prepare(`INSERT INTO driver_portal_tokens
    (id,organization_id,driver_id,token_hash,label,expires_at) VALUES (?,?,?,?,?,?)`).bind(
      uid('portal_'), ORG_ID, driverId, await sha256(token), `Acesso de ${driver.name}`, expires,
    ).run();
  return { driver, expiresAt: expires, url: `${origin}/driver.html?token=${token}` };
}

export async function revokeDriverPortalLinks(db, driverId) {
  const result = await db.prepare(`UPDATE driver_portal_tokens SET revoked_at=CURRENT_TIMESTAMP
    WHERE driver_id=? AND revoked_at IS NULL`).bind(driverId).run();
  return { revoked: result.meta?.changes || 0 };
}

export async function portalBootstrap(db, token, period = 'year', referenceDate) {
  if (!token) throw new Error('Ligação de acesso inválida.');
  const hash = await sha256(token);
  const record = await db.prepare(`SELECT t.*,d.name driver_name FROM driver_portal_tokens t
    JOIN drivers d ON d.id=t.driver_id
    WHERE t.token_hash=? AND t.revoked_at IS NULL AND t.expires_at>CURRENT_TIMESTAMP`).bind(hash).first();
  if (!record) throw new Error('Esta ligação expirou ou foi revogada.');
  await db.prepare('UPDATE driver_portal_tokens SET last_used_at=CURRENT_TIMESTAMP WHERE id=?').bind(record.id).run();
  const mirror = await driverMirror(db, { driverId: record.driver_id, period, referenceDate });
  return { organization: { id: ORG_ID, name: 'TVDE Gest' }, driver: mirror.driver, mirror, expiresAt: record.expires_at };
}
