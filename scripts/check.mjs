import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd();

const files = [
  'src/worker.js', 'src/db.js', 'src/settlements.js',
  'src/platforms/bolt.js', 'src/platforms/uber.js',
  'public/index.html', 'wrangler.jsonc', 'package.json', 'migrations/0001_initial.sql',
];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`${file} está vazio.`);
}

const html = await readFile('public/index.html', 'utf8');
for (const required of ['Acertos semanais', '/api/sync/uber', '/api/sync/bolt', '/api/data/snapshot']) {
  if (!html.includes(required)) throw new Error(`O painel não contém ${required}.`);
}
if (html.includes('s-bolt-proxy')) throw new Error('Ainda existe configuração antiga de proxy no painel.');
if (html.includes('const platforms=') && html.includes('plataformas,')) {
  throw new Error('Possível regressão platforms/plataformas detetada.');
}

const tracked = await Promise.all(files.map((file) => readFile(file, 'utf8'))).then((parts) => parts.join('\n'));
const secretPatterns = [
  /client_secret\s*[:=]\s*["'][^"']{12,}/i,
  /BOLT_CLIENT_SECRET\s*=\s*(?!coloca_aqui)[^\s#]+/,
  /UBER_CLIENT_SECRET\s*=\s*(?!\s*$)[A-Za-z0-9_-]{12,}/,
];
if (secretPatterns.some((pattern) => pattern.test(tracked))) {
  throw new Error('Foi detetado um possível segredo em ficheiros versionados.');
}

const migration = await readFile('migrations/0001_initial.sql', 'utf8');
for (const table of ['drivers', 'vehicles', 'financial_entries', 'weekly_settlements', 'settlement_rules', 'sync_runs']) {
  if (!migration.includes(`TABLE IF NOT EXISTS ${table}`)) throw new Error(`Tabela ${table} em falta na migração.`);
}
console.log('Verificação concluída: Bolt, Uber, D1, Cron e acertos semanais OK.');

for (const required of [
  'migrations/0002_compliance.sql',
  'src/compliance.js',
  'public/privacy.html',
  'public/terms.html',
]) {
  if (!existsSync(resolve(root, required))) throw new Error(`Falta ficheiro obrigatório: ${required}`);
}
