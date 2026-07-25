# TVDE Gest

Aplicação interna para gestão da frota TVDE de Daniel SC Mediação de Seguros e Serviços, Lda.

## Módulos
- Espelho geral Bolt/Uber com rastreabilidade da origem
- Motoristas e viaturas
- Sincronizações
- Acertos semanais
- Análise individual semanal, trimestral e anual
- Pagamentos e saldos
- Auditoria e privacidade

## Fórmula dos acertos

`(viagens Uber + Bolt) / 1,06 + gorjetas + portagens - aluguer/slot/4% - pagamentos já efetuados = saldo`

## Atualizar

Extrair o ZIP para uma pasta temporária e executar `ATUALIZAR.ps1`. O atualizador preserva `wrangler.jsonc`, `.dev.vars`, `.git` e `.wrangler`.

## Publicar

```powershell
Set-Location "D:\TVDE Gest"
.\PUBLICAR.ps1
```


## Arquivo histórico Bolt

O TVDE Gest consulta `getFleetOrders` com `time_range_filter_type: price_review`, pagina até 1000 registos e guarda cada ordem usando `order_reference` como chave única. A importação histórica é dividida em blocos semanais e retomada automaticamente pelo cron, evitando os limites de pedidos da Bolt e da Cloudflare.
