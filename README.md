# TVDE Gest

Versão 0.4.1 da aplicação de gestão de frota TVDE com integração oficial à Bolt Fleet Integration API. O mesmo Cloudflare Worker serve o painel e a API, mantendo o `BOLT_CLIENT_SECRET` fora do navegador e fora do GitHub.

**Repositório oficial:** `https://github.com/Pocas13/TVDE-Gest.git`

## Estrutura

- `public/index.html` — painel TVDE Gest.
- `src/worker.js` — autenticação OAuth2 e comunicação servidor-a-servidor com a Bolt.
- `wrangler.jsonc` — configuração do Cloudflare Worker `tvde-gest`.
- `.github/workflows/deploy.yml` — validação e publicação automática após `git push` para `main`.
- `.dev.vars.example` — modelo das credenciais locais; nunca é enviado para o GitHub.
- `scripts/ligar-github.ps1` — configura ou corrige o remote do repositório.

## 1. Abrir no VS Code

Extrai o ZIP para:

```powershell
D:\TVDE Gest
```

Depois executa:

```powershell
Set-Location "D:\TVDE Gest"
code .
npm install
Copy-Item .dev.vars.example .dev.vars
```

Edita `.dev.vars` e coloca as credenciais fornecidas pela Bolt:

```env
BOLT_CLIENT_ID=O_TEU_CLIENT_ID
BOLT_CLIENT_SECRET=O_TEU_CLIENT_SECRET
```

Não uses aspas. O ficheiro `.dev.vars` está incluído no `.gitignore`.

> Como a pasta tem um espaço no nome, usa sempre aspas no PowerShell. Também podes escrever `cd "D:\TVDE Gest"`.

## 2. Testar localmente

```powershell
npm run check
npm run dev
```

Abre o endereço apresentado pelo Wrangler, normalmente:

```text
http://localhost:8787
```

No painel, abre **Integrações**, testa a ligação, descobre a empresa e sincroniza os dados.

## 3. Ligar ao GitHub existente

O repositório `Pocas13/TVDE-Gest` já existe. Para configurar tudo automaticamente:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\ligar-github.ps1
```

Ou manualmente:

```powershell
git init
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/Pocas13/TVDE-Gest.git
git add .
git commit -m "Projeto inicial TVDE Gest"
git push -u origin main
```

Antes do `push`, confirma:

```powershell
git status
```

O ficheiro `.dev.vars` nunca deve aparecer entre os ficheiros a publicar.

## 4. Publicação automática no Cloudflare

No GitHub, abre:

```text
Settings > Secrets and variables > Actions
```

Cria os seguintes secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

O workflow em `.github/workflows/deploy.yml` executa `npm run check` e publica o Worker em cada `push` para `main`.

Podes, em alternativa, ligar diretamente o repositório no Cloudflare. Usa apenas um método de deployment para evitar duas publicações por commit.

## 5. Credenciais Bolt na produção

Depois do primeiro deployment, abre:

```text
Cloudflare > Workers & Pages > tvde-gest > Settings > Variables and Secrets
```

Cria como **Secret**:

- `BOLT_CLIENT_ID`
- `BOLT_CLIENT_SECRET`

Ou usa o terminal:

```powershell
npx wrangler login
npx wrangler secret put BOLT_CLIENT_ID
npx wrangler secret put BOLT_CLIENT_SECRET
```

As credenciais Bolt não entram no HTML, no GitHub Actions ou no repositório.

## 6. Segurança

Antes da utilização real, protege a aplicação com Cloudflare Access. O painel atual guarda os dados sincronizados no `localStorage` do navegador. A evolução recomendada é usar Cloudflare D1 ou PostgreSQL/Neon para dados partilhados, histórico, utilizadores, permissões e cópias de segurança.
