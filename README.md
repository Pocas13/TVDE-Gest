# TVDE Gest v0.5.0

Gestão de frota TVDE com:

- Integração oficial Bolt Fleet Integration API.
- Estrutura preparada para Uber Supplier Platform API.
- Base de dados Cloudflare D1.
- Sincronização automática por Cron Trigger.
- Acertos semanais configuráveis por motorista.
- Deploy automático GitHub → Cloudflare.

Repositório: `https://github.com/Pocas13/TVDE-Gest.git`

## 1. Atualizar a pasta no VS Code

Faz primeiro uma cópia da pasta atual. Depois extrai o ZIP e substitui os ficheiros em:

```powershell
Set-Location "D:\TVDE Gest"
code .
npm install
```

## 2. Criar a base de dados D1

Executa:

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\configurar-d1.ps1"
```

O script:

1. autentica o Wrangler na Cloudflare;
2. cria `tvde-gest-db`;
3. adiciona ao `wrangler.jsonc` o binding `DB`;
4. aplica as migrações localmente;
5. aplica as migrações na Cloudflare.

Quando o Wrangler perguntar se deve acrescentar a base ao `wrangler.jsonc`, escolhe **Yes**.

Confirma que ficou algo semelhante a:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "tvde-gest-db",
    "database_id": "UUID-DA-TUA-BASE"
  }
]
```

## 3. Credenciais locais

```powershell
Copy-Item .dev.vars.example .dev.vars
```

Edita `.dev.vars`:

```env
BOLT_CLIENT_ID=O_TEU_CLIENT_ID
BOLT_CLIENT_SECRET=O_TEU_CLIENT_SECRET
BOLT_COMPANY_ID=

UBER_CLIENT_ID=
UBER_CLIENT_SECRET=
UBER_ORG_ID=
```

O `.dev.vars` não é enviado para o GitHub.

## 4. Testar localmente

```powershell
npm run check
npm run db:migrate:local
npm run dev
```

Abre normalmente:

```text
http://localhost:8787
```

No painel:

1. abre **Integrações**;
2. carrega em **Testar integrações**;
3. guarda o `company_id` Bolt detetado;
4. carrega em **Sincronizar Bolt**;
5. abre **Acertos semanais**;
6. escolhe a regra de cada motorista;
7. calcula a semana.

## 5. Publicar no Cloudflare

### Secrets das plataformas

```powershell
npx wrangler secret put BOLT_CLIENT_ID
npx wrangler secret put BOLT_CLIENT_SECRET
```

Quando tiveres aprovação e credenciais Uber:

```powershell
npx wrangler secret put UBER_CLIENT_ID
npx wrangler secret put UBER_CLIENT_SECRET
```

Os IDs de empresa/organização não são segredos. Guarda-os através do painel em **Integrações → Guardar IDs** ou configura-os como variáveis normais no Dashboard Cloudflare, em **Variables and Secrets**.

### Deploy manual

```powershell
npm run db:migrate:remote
npm run deploy
```

### GitHub

```powershell
Set-Location "D:\TVDE Gest"
git add .
git commit -m "Adiciona Uber, D1, sincronização automática e acertos semanais"
git push
```

O workflow aplica as migrações D1 e publica o Worker.

## 6. Sincronização automática

O `wrangler.jsonc` contém:

```jsonc
"triggers": {
  "crons": [
    "15 */2 * * *",
    "30 5 * * MON"
  ]
}
```

- `15 */2 * * *`: sincroniza Bolt e Uber a cada duas horas, ao minuto 15.
- `30 5 * * MON`: calcula os acertos da semana anterior às 05:30 UTC de segunda-feira.

Os Cron Triggers da Cloudflare usam UTC. Em Portugal, o segundo horário corresponde normalmente a 05:30 no inverno e 06:30 no verão.

## 7. Uber

A existência de uma conta de frota Uber não concede automaticamente acesso à API. É necessário criar uma aplicação no Uber Developer Dashboard e pedir acesso à Supplier Platform/Fleet APIs.

Scopes preparados no projeto:

```text
vehicle_suppliers.organizations.read
solutions.suppliers.metrics.read
solutions.suppliers.drivers.status.read
supplier.partner.payments
```

Depois da aprovação:

1. gera `Client ID` e `Client Secret`;
2. coloca-os como Secrets no Cloudflare;
3. abre **Integrações**;
4. carrega em **Testar integrações**;
5. o TVDE Gest tenta descobrir o `organization_id`;
6. guarda o ID;
7. carrega em **Sincronizar Uber**.

Consulta `docs/UBER.md` para o pedido recomendado à Uber.

## 8. Acertos semanais

Cada motorista pode ter uma regra diferente:

### Apenas aluguer

```text
Saldo = - aluguer semanal - taxa fixa + créditos - débitos
```

Os rendimentos Bolt/Uber são apenas informativos. Um saldo negativo significa que o motorista deve esse valor à empresa.

### Frota paga motorista

```text
Saldo = líquido Bolt + líquido Uber - aluguer - taxa fixa + créditos - débitos
```

Um saldo positivo significa que a empresa paga ao motorista.

### Percentagem

```text
Parcela do motorista = líquido das plataformas × percentagem
Saldo = parcela - aluguer - taxa fixa + créditos - débitos
```

A regra inicial criada automaticamente é **Apenas aluguer, 250,00 € por semana**, mas fica **desativada**. Confirma os valores e ativa-a individualmente antes de calcular qualquer acerto real.

Mais detalhes em `docs/CALCULOS-SEMANAIS.md`.

## 9. Segurança

- Nunca colocar `Client Secret` no HTML, GitHub ou `wrangler.jsonc`.
- Ativar Cloudflare Access e depois definir `REQUIRE_CF_ACCESS=true`.
- Limitar o acesso ao teu e-mail ou aos administradores autorizados.
- Rever a retenção de dados, especialmente localizações e moradas.
- O projeto não guarda moradas de recolha/destino nem coordenadas das viagens.
