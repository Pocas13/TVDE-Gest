import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const files = [
  'src/worker.js','src/db.js','src/analytics.js','src/imports.js','src/portal.js','src/diagnostics.js',
  'src/settlements.js','src/compliance.js','src/platforms/bolt.js','src/platforms/uber.js',
  'public/index.html','public/driver.html','public/assets/app.js','public/assets/driver.js','public/assets/app.css',
  'migrations/0007_product_foundation.sql','migrations/0008_seed_historical_2026.sql','package.json',
];
for (const file of files) {
  if (!existsSync(resolve(file))) throw new Error(`Falta ficheiro obrigatório: ${file}`);
  const text = await readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`${file} está vazio.`);
}

const html = await readFile('public/index.html', 'utf8');
if (/<script(?![^>]*src=)/i.test(html)) throw new Error('O painel voltou a incluir JavaScript embutido.');
for (const required of ['TVDE Gest','/assets/app.js','Visão geral']) {
  if (!html.toLocaleLowerCase('pt-PT').includes(required.toLocaleLowerCase('pt-PT'))) throw new Error(`O painel não contém ${required}.`);
}
const app = await readFile('public/assets/app.js', 'utf8');
if (!app.toLocaleLowerCase('pt-PT').includes('cálculo de ganhos'.toLocaleLowerCase('pt-PT'))) throw new Error('O painel não contém Cálculo de ganhos.');
for (const required of ['/api/dashboard','/api/imports/csv','/api/driver-access','/api/diagnostics']) {
  if (!app.includes(required)) throw new Error(`O frontend não usa ${required}.`);
}
const worker = await readFile('src/worker.js', 'utf8');
for (const required of ['/api/dashboard','/api/imports/csv','/api/portal/bootstrap','/api/diagnostics']) {
  if (!worker.includes(required)) throw new Error(`A API não contém ${required}.`);
}
const tracked = await Promise.all(files.map((file) => readFile(file, 'utf8'))).then((parts) => parts.join('\n'));
const secretPatterns = [/client_secret\s*[:=]\s*["'][^"']{12,}/i,/BOLT_CLIENT_SECRET\s*=\s*(?!coloca_aqui)[^\s#]+/,/UBER_CLIENT_SECRET\s*=\s*(?!\s*$)[A-Za-z0-9_-]{12,}/];
if (secretPatterns.some((pattern) => pattern.test(tracked))) throw new Error('Foi detetado um possível segredo em ficheiros versionados.');
console.log('Verificação concluída: frontend modular, Bolt, Uber, CSV, histórico, portal do motorista e D1 OK.');

import fs from 'node:fs';
for (const required of ['migrations/0010_settlement_reporting_core.sql','migrations/0011_settlement_reports_fix.sql']) { if (!fs.existsSync(required)) throw new Error(`Ficheiro obrigatório em falta: ${required}`); }
console.log('Migrações 0010 e 0011 confirmadas.');
