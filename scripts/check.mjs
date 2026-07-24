import { readFile, writeFile, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const files = ['src/worker.js', 'public/index.html', 'wrangler.jsonc', 'package.json'];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`${file} está vazio.`);
}

const html = await readFile('public/index.html', 'utf8');
if (!html.includes("fetch(path,options)")) throw new Error('O painel não está configurado para API na mesma origem.');
if (html.includes('s-bolt-proxy')) throw new Error('Ainda existe configuração antiga de proxy no painel.');

// Regressão do erro encontrado na sincronização de motoristas.
if (html.includes('const platforms=Array.from')) {
  throw new Error('Erro de variável: usa plataformas, não platforms, em upsertBoltDriver.');
}
if (!html.includes("const plataformas=Array.from(new Set([...(existing?.plataformas||[]),'Bolt']))")) {
  throw new Error('A normalização das plataformas do motorista não foi encontrada.');
}

// Valida também a sintaxe do JavaScript inline do painel.
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((script) => script.trim());
const tempFile = join(process.cwd(), '.check-inline-script.mjs');
try {
  await writeFile(tempFile, inlineScripts.join('\n'), 'utf8');
  execFileSync(process.execPath, ['--check', tempFile], { stdio: 'pipe' });
} finally {
  await unlink(tempFile).catch(() => {});
}

const tracked = `${await readFile('src/worker.js', 'utf8')}\n${html}\n${await readFile('wrangler.jsonc', 'utf8')}`;
const secretPatterns = [/client_secret\s*[:=]\s*["'][^"']{12,}/i, /BOLT_CLIENT_SECRET\s*=\s*[^\s#]+/];
if (secretPatterns.some((pattern) => pattern.test(tracked))) {
  throw new Error('Foi detetado um possível segredo em ficheiros versionados.');
}
console.log('Verificação concluída: estrutura, JavaScript e segurança básica OK.');
