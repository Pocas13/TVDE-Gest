$ErrorActionPreference = "Stop"
Set-Location "D:\TVDE Gest"

if (!(Test-Path ".\wrangler.jsonc")) { throw "Falta o wrangler.jsonc." }
$config = Get-Content ".\wrangler.jsonc" -Raw
if ($config -notmatch '"d1_databases"' -or $config -notmatch '"binding"\s*:\s*"DB"') {
  throw "Publicação bloqueada: o wrangler.jsonc não contém o binding D1 DB."
}

npm install
npm run check
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
Write-Host "TVDE Gest publicado com D1 validada." -ForegroundColor Green
