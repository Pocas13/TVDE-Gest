$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "TVDE Gest - configuração Cloudflare D1" -ForegroundColor Cyan
npm install
npx wrangler login

$wrangler = Get-Content ".\wrangler.jsonc" -Raw
if ($wrangler -notmatch '"binding"\s*:\s*"DB"') {
  Write-Host "A criar a base tvde-gest-db. Quando o Wrangler perguntar, escolhe Yes para adicionar o binding ao wrangler.jsonc." -ForegroundColor Yellow
  npx wrangler d1 create tvde-gest-db
} else {
  Write-Host "O binding D1 já existe no wrangler.jsonc." -ForegroundColor Green
}

Write-Host "A aplicar as migrações localmente..." -ForegroundColor Cyan
npx wrangler d1 migrations apply tvde-gest-db --local

Write-Host "A aplicar as migrações na Cloudflare..." -ForegroundColor Cyan
npx wrangler d1 migrations apply tvde-gest-db --remote

Write-Host "Configuração D1 concluída." -ForegroundColor Green
