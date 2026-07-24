import { readFile } from 'node:fs/promises';

const files = ['src/worker.js', 'public/index.html', 'wrangler.jsonc', 'package.json'];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`${file} está vazio.`);
}

const html = await readFile('public/index.html', 'utf8');
if (!html.includes("fetch(path,options)")) throw new Error('O painel não está configurado para API na mesma origem.');
if (html.includes('s-bolt-proxy')) throw new Error('Ainda existe configuração antiga de proxy no painel.');

const tracked = `${await readFile('src/worker.js', 'utf8')}\n${html}\n${await readFile('wrangler.jsonc', 'utf8')}`;
const secretPatterns = [/client_secret\s*[:=]\s*["'][^"']{12,}/i, /BOLT_CLIENT_SECRET\s*=\s*[^\s#]+/];
if (secretPatterns.some((pattern) => pattern.test(tracked))) {
  throw new Error('Foi detetado um possível segredo em ficheiros versionados.');
}
console.log('Verificação concluída: estrutura e segurança básica OK.');
