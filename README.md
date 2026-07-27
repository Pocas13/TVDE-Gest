# TVDE Gest

Cockpit financeiro e operacional para frotas TVDE, com Cloudflare Workers, D1, Bolt, Uber, importação CSV e cálculo semanal dos valores a pagar aos motoristas.

## Sincronizar

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\SINCRONIZAR.ps1"
```

A migração `0009_financial_core_real_reports.sql` corrige o núcleo financeiro e carrega os relatórios semanais reais Bolt/Uber fornecidos para validação.
