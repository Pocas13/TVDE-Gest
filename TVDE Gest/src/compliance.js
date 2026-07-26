import { uid } from './db.js';

export async function audit(db, { actorEmail, action, resourceType, resourceId, platform, ipHash, details } = {}) {
  if (!db || !action) return;
  await db.prepare(`
    INSERT INTO audit_logs (id, actor_email, action, resource_type, resource_id, platform, ip_hash, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(uid('aud_'), actorEmail || null, action, resourceType || null, resourceId || null,
    platform || null, ipHash || null, details ? JSON.stringify(details) : null).run();
}

export async function listAuditLogs(db, limit = 100) {
  const safe = Math.min(500, Math.max(1, Number(limit) || 100));
  const result = await db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').bind(safe).all();
  return result.results || [];
}

export async function upsertConsent(db, input) {
  if (!input.driverId || !input.platform || !input.consentType || !input.policyVersion) {
    throw new Error('Consentimento incompleto.');
  }
  const id = uid('con_');
  const granted = input.granted === true ? 1 : 0;
  await db.prepare(`
    INSERT INTO privacy_consents (
      id, driver_id, platform, consent_type, policy_version, granted,
      granted_at, revoked_at, evidence_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(driver_id, platform, consent_type, policy_version) DO UPDATE SET
      granted = excluded.granted,
      granted_at = excluded.granted_at,
      revoked_at = excluded.revoked_at,
      evidence_json = excluded.evidence_json,
      updated_at = CURRENT_TIMESTAMP
  `).bind(id, input.driverId, input.platform, input.consentType, input.policyVersion, granted,
    granted ? new Date().toISOString() : null, granted ? null : new Date().toISOString(),
    input.evidence ? JSON.stringify(input.evidence) : null).run();
  return { ok: true };
}

export async function listConsents(db) {
  const result = await db.prepare(`
    SELECT c.*, d.name AS driver_name FROM privacy_consents c
    JOIN drivers d ON d.id = c.driver_id
    ORDER BY d.name, c.platform, c.updated_at DESC
  `).all();
  return result.results || [];
}

export async function deletePlatformData(db, { platform, driverId = null }) {
  if (!['Uber','Bolt'].includes(platform)) throw new Error('Plataforma inválida.');
  const params = driverId ? [platform, driverId] : [platform];
  const suffix = driverId ? ' AND driver_id = ?' : '';
  await db.batch([
    db.prepare(`DELETE FROM financial_entries WHERE platform = ?${suffix}`).bind(...params),
    db.prepare(`DELETE FROM driver_platform_accounts WHERE platform = ?${suffix}`).bind(...params),
    ...(driverId ? [] : [db.prepare('DELETE FROM vehicle_platform_accounts WHERE platform = ?').bind(platform)]),
  ]);
  return { ok: true, platform, driverId };
}

export async function retentionCleanup(db, platform, retentionDays) {
  const days = Math.min(3650, Math.max(1, Number(retentionDays) || 90));
  const result = await db.prepare(`
    DELETE FROM financial_entries
    WHERE platform = ? AND service_date < date('now', ?)
  `).bind(platform, `-${days} days`).run();
  return { platform, retentionDays: days, deleted: result.meta?.changes || 0 };
}
