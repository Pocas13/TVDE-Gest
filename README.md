# TVDE Gest

Cockpit de gestão de frotas TVDE em Cloudflare Workers + D1.

## Executar

```powershell
npm run dev
```

Abrir o endereço indicado pelo Wrangler, normalmente `http://127.0.0.1:8787` ou `http://127.0.0.1:8788`.

## Validar e publicar

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\SINCRONIZAR.ps1"
```

## Dados já incluídos

- Bolt agregado: 30/12/2025 a 31/05/2026.
- Bolt agregado: 01/06/2026 a 19/07/2026.
- Uber atividade: 15/06/2026 a 13/07/2026.

Os dados agregados não são distribuídos artificialmente por dia ou semana. A API detalhada Bolt passa a ser usada após o corte configurado.
