$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$OutputEncoding = [System.Text.Encoding]::UTF8

function Invoke-Wrangler {
  param([Parameter(Mandatory=$true)][string[]]$Arguments)
  & npx wrangler @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Falhou: npx wrangler $($Arguments -join ' ')"
  }
}

Write-Host "TVDE Gest - reparar e configurar Cloudflare D1" -ForegroundColor Cyan

npm install
if ($LASTEXITCODE -ne 0) { throw "npm install falhou." }

Invoke-Wrangler @("login")

# Recria uma configuração Wrangler válida. O binding D1 é adicionado abaixo.
$baseConfig = @'
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "tvde-gest",
  "main": "src/worker.js",
  "compatibility_date": "2026-07-25",
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "run_worker_first": true,
    "not_found_handling": "single-page-application"
  },
  "observability": {
    "enabled": true
  },
  "triggers": {
    "crons": [
      "15 */2 * * *",
      "30 5 * * MON"
    ]
  }
}
'@
Set-Content -Path ".\wrangler.jsonc" -Value $baseConfig -Encoding utf8

Write-Host "A procurar a base tvde-gest-db..." -ForegroundColor Cyan
$listJson = & npx wrangler d1 list --json
if ($LASTEXITCODE -ne 0) { throw "Não foi possível listar as bases D1." }

$databases = $listJson | ConvertFrom-Json
$db = $databases | Where-Object { $_.name -eq "tvde-gest-db" } | Select-Object -First 1

if ($null -eq $db) {
  Write-Host "A base não existe. A criar e associar o binding DB..." -ForegroundColor Yellow
  Invoke-Wrangler @("d1", "create", "tvde-gest-db", "--binding", "DB", "--update-config")
} else {
  Write-Host "Base encontrada. A associar o binding DB..." -ForegroundColor Green
  $config = Get-Content ".\wrangler.jsonc" -Raw | ConvertFrom-Json
  $binding = [PSCustomObject]@{
    binding = "DB"
    database_name = "tvde-gest-db"
    database_id = $db.uuid
    migrations_dir = "migrations"
  }
  $config | Add-Member -NotePropertyName d1_databases -NotePropertyValue @($binding) -Force
  $config | ConvertTo-Json -Depth 20 | Set-Content ".\wrangler.jsonc" -Encoding utf8
}

Write-Host "A aplicar migrações localmente..." -ForegroundColor Cyan
Invoke-Wrangler @("d1", "migrations", "apply", "DB", "--local")

Write-Host "A aplicar migrações na Cloudflare..." -ForegroundColor Cyan
Invoke-Wrangler @("d1", "migrations", "apply", "DB", "--remote")

Write-Host "D1 configurada com sucesso." -ForegroundColor Green
