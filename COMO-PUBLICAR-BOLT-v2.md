# Publicar a integração Bolt com segurança

## Ficheiros

- `worker-bolt-seguro-v2.js`: proxy seguro entre o painel e a Bolt.
- `gestao-frota-bolt-v2.html`: painel revisto, com sincronização de empresas, motoristas, veículos e viagens.
- `wrangler.jsonc.example`: configuração de exemplo para publicação com Wrangler.

## O que mudou

1. O `client_secret` continua apenas no Cloudflare Worker.
2. O Worker já não devolve qualquer parte do token OAuth.
3. Os pedidos são validados antes de seguirem para a Bolt.
4. Os corpos JSON cumprem os campos obrigatórios do OpenAPI enviado pela Bolt.
5. Há paginação automática.
6. Um token expirado provoca uma única renovação e repetição do pedido.
7. O painel descobre o `company_id` automaticamente.
8. Motoristas e veículos são atualizados sem criar duplicados.
9. As viagens usam `order_reference` como identificador único.
10. O painel não guarda moradas, coordenadas de recolha ou destino.
11. Foi adicionada compatibilidade com `localStorage`, para o HTML funcionar fora do ambiente onde existia `window.storage`.
12. Os dados fictícios deixaram de ser carregados automaticamente.

## Publicação pelo painel da Cloudflare

1. Abra **Workers & Pages**.
2. Crie um Worker chamado, por exemplo, `bolt-fleet-proxy`.
3. Substitua o código pelo conteúdo de `worker-bolt-seguro-v2.js`.
4. Em **Settings > Variables and Secrets**, crie como **Secrets**:
   - `BOLT_CLIENT_ID`
   - `BOLT_CLIENT_SECRET`
5. Crie como variáveis normais:
   - `ALLOWED_ORIGINS` = domínio exato onde o painel será publicado, sem barra final.
   - `REQUIRE_CF_ACCESS` = `true`
   - `ALLOW_NO_ORIGIN` = `false`
6. Publique o Worker.

Nunca coloque `BOLT_CLIENT_ID` ou `BOLT_CLIENT_SECRET` dentro do HTML, no GitHub ou nas variáveis `vars` do ficheiro Wrangler.

## Publicação com Wrangler

Numa pasta nova, coloque:

```text
worker-bolt-seguro-v2.js
wrangler.jsonc
```

Renomeie `wrangler.jsonc.example` para `wrangler.jsonc` e ajuste `ALLOWED_ORIGINS`.

Depois execute:

```bash
npm install --save-dev wrangler
npx wrangler login
npx wrangler secret put BOLT_CLIENT_ID
npx wrangler secret put BOLT_CLIENT_SECRET
npx wrangler deploy
```

O Wrangler pede cada segredo no terminal; não o escreva diretamente no comando.

## Proteger com Cloudflare Access

CORS não é uma palavra-passe. Mesmo com `ALLOWED_ORIGINS`, alguém pode tentar chamar o Worker com ferramentas fora do browser.

Depois de publicar:

1. Abra o Worker na Cloudflare.
2. Vá a **Settings > Domains & Routes**.
3. Ative **Cloudflare Access** no endereço `workers.dev` ou no domínio personalizado.
4. Crie uma política **Allow** apenas para o seu endereço de e-mail ou para os utilizadores autorizados.
5. Mantenha `REQUIRE_CF_ACCESS=true`.

Faça primeiro a configuração do Access e só depois ative `REQUIRE_CF_ACCESS=true`, para não se bloquear acidentalmente.

## Publicar o painel

O ficheiro `gestao-frota-bolt-v2.html` pode ser publicado num domínio HTTPS, por exemplo através de Cloudflare Pages, Vercel ou outro alojamento estático.

O domínio final do painel tem de coincidir exatamente com `ALLOWED_ORIGINS` no Worker. Exemplo:

```text
ALLOWED_ORIGINS=https://painel.seudominio.pt
```

Para permitir mais do que um domínio:

```text
ALLOWED_ORIGINS=https://painel.seudominio.pt,https://www.painel.seudominio.pt
```

## Primeira utilização

1. Abra **Integrações** no painel.
2. Cole o URL HTTPS do Worker.
3. Escolha um intervalo de datas curto para o primeiro teste, por exemplo sete dias.
4. Clique em **Testar ligação**.
5. Clique em **Descobrir empresa**. O painel guarda o primeiro `company_id` devolvido pela Bolt.
6. Clique em **Sincronizar tudo**.

A sincronização executa esta ordem:

```text
getCompanies
getDrivers
getVehicles
getFleetOrders
```

## Campos corretos dos pedidos Bolt

### getDrivers

```json
{
  "company_id": 123,
  "start_ts": 1752796800,
  "end_ts": 1753401600,
  "offset": 0,
  "limit": 1000
}
```

### getVehicles

```json
{
  "company_id": 123,
  "start_ts": 1752796800,
  "end_ts": 1753401600,
  "offset": 0,
  "limit": 100
}
```

### getFleetOrders

A documentação exige `company_ids`, mesmo quando também é enviado `company_id`:

```json
{
  "company_id": 123,
  "company_ids": [123],
  "start_ts": 1752796800,
  "end_ts": 1753401600,
  "time_range_filter_type": "price_review",
  "offset": 0,
  "limit": 1000
}
```

O Worker corrige automaticamente `company_ids` quando recebe apenas `company_id`, mas o painel já envia ambos corretamente.

## Limitações desta versão

- Os dados ficam guardados no navegador. Não são ainda uma base de dados central multiutilizador.
- Se limpar os dados do navegador, perde a cópia local.
- Para produção real, o passo seguinte deve ser guardar motoristas, veículos, viagens e sincronizações numa base de dados PostgreSQL/Neon.
- A API pode limitar o tamanho máximo do intervalo temporal. Se a Bolt devolver `INVALID_DATE_RANGE`, reduza as datas no painel.
- A documentação enviada não inclui um endpoint específico de pagamentos semanais fora dos preços associados às viagens. O painel usa `order_price.net_earnings` como valor líquido oficial de cada ordem.

## Segurança operacional

- Não envie o `client_secret` por e-mail, WhatsApp ou chat.
- Se o segredo já tiver sido partilhado ou colocado no código, revogue-o e gere outro no Fleet Owner Portal.
- Não publique respostas integrais da API que contenham telefone ou e-mail dos motoristas.
- Faça cópias de segurança quando migrar para uma base de dados.
