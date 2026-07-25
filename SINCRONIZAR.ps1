$ErrorActionPreference = "Stop"
Set-Location "D:\TVDE Gest"

if (!(Test-Path ".\wrangler.jsonc")) { throw "Falta o wrangler.jsonc." }
$config = Get-Content ".\wrangler.jsonc" -Raw
if ($config -notmatch '"d1_databases"' -or $config -notmatch '"binding"\s*:\s*"DB"') {
  throw "Sincronização bloqueada: o wrangler.jsonc não contém o binding D1 DB."
}

npm install
npm run check
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy

if (Test-Path ".git") {
  git add .
  $alteracoes = git status --porcelain
  if ($alteracoes) {
    git commit -m "Atualiza TVDE Gest"
    git push origin main
  } else {
    Write-Host "GitHub já estava atualizado." -ForegroundColor Yellow
  }
}
Write-Host "TVDE Gest sincronizado com Cloudflare e GitHub." -ForegroundColor Green
