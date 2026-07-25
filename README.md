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
