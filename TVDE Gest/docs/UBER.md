# Pedido de acesso Uber para o TVDE Gest

## Objetivo

Integrar uma frota TVDE já existente com o TVDE Gest para consultar:

- organizações autorizadas;
- motoristas da frota;
- viaturas;
- movimentos/pagamentos;
- métricas de desempenho.

## Produto/API a solicitar

Solicitar acesso à **Supplier Platform API para Fleet Suppliers**, através de credenciais OAuth2 Client Credentials.

## Scopes necessários

```text
vehicle_suppliers.organizations.read
solutions.suppliers.metrics.read
solutions.suppliers.drivers.status.read
supplier.partner.payments
```

O scope de PII/licença de condução não é necessário para a primeira versão.

## Texto sugerido para o pedido

Pretendemos integrar a nossa conta de Fleet Partner em Portugal com uma aplicação interna denominada TVDE Gest. A aplicação será utilizada exclusivamente para gestão da nossa própria frota, permitindo sincronizar motoristas, viaturas, métricas operacionais e movimentos financeiros. A integração será servidor-a-servidor através de OAuth2 Client Credentials. As credenciais serão guardadas como secrets no Cloudflare Worker e os dados serão armazenados numa base de dados privada Cloudflare D1, com acesso restrito por Cloudflare Access. Não pretendemos disponibilizar dados a terceiros nem efetuar ações na conta sem autorização.

Solicitamos acesso aos seguintes scopes:

- vehicle_suppliers.organizations.read
- solutions.suppliers.metrics.read
- solutions.suppliers.drivers.status.read
- supplier.partner.payments

Solicitamos também confirmação do organization ID principal, limites aplicáveis e disponibilidade dos endpoints para Portugal.

## Depois da aprovação

Configura:

```powershell
npx wrangler secret put UBER_CLIENT_ID
npx wrangler secret put UBER_CLIENT_SECRET
```

No painel, usa **Integrações → Testar integrações** para descobrir a organização e depois **Sincronizar Uber**.
