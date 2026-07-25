$ErrorActionPreference = "Stop"
Set-Location "D:\TVDE Gest"

function Invoke-Step([string]$Name, [scriptblock]$Command) {
  Write-Host "`n==> $Name" -ForegroundColor Cyan
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Name falhou com o código $LASTEXITCODE." }
}

if (!(Test-Path ".\wrangler.jsonc")) { throw "Falta o wrangler.jsonc." }
$config = Get-Content ".\wrangler.jsonc" -Raw
if ($config -notmatch '"d1_databases"' -or $config -notmatch '"binding"\s*:\s*"DB"') {
  throw "Sincronização bloqueada: o wrangler.jsonc não contém o binding D1 DB."
}

Invoke-Step "Instalar dependências" { npm install }
Invoke-Step "Validar projeto" { npm run check }
Invoke-Step "Aplicar migrações D1" { npx wrangler d1 migrations apply DB --remote }
Invoke-Step "Publicar na Cloudflare" { npx wrangler deploy }

if (Test-Path ".git") {
  Invoke-Step "Preparar Git" { git add . }
  $alteracoes = git status --porcelain
  if ($alteracoes) {
    Invoke-Step "Criar commit" { git commit -m "Atualiza TVDE Gest" }
    Invoke-Step "Enviar para o GitHub" { git push origin main }
  } else {
    Write-Host "GitHub já estava atualizado." -ForegroundColor Yellow
  }
}
Write-Host "`nTVDE Gest sincronizado com Cloudflare e GitHub." -ForegroundColor Green
