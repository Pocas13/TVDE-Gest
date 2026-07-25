$ErrorActionPreference = "Stop"
$origem = Split-Path -Parent $MyInvocation.MyCommand.Path
$destino = "D:\TVDE Gest"

New-Item -ItemType Directory -Force -Path $destino | Out-Null

# Limpa apenas ficheiros antigos conhecidos; nunca toca em configuração, dados locais ou Git.
$obsoletos = @(
  "ATUALIZAR-v0.5.0.md","CHANGELOG-v0.6.2.md","CHANGELOG-v0.7.0.md","CHANGELOG-v0.7.1.md",
  "CHANGELOG-v0.7.2.md","CHANGELOG-v1.0.0.md","CHANGELOG-v1.0.1.md","COMO-PUBLICAR-BOLT-v2.md",
  "gestao-frota-bolt-v2.html","LEIA-ME.txt","worker-bolt-seguro-v2.js","wrangler.jsonc.example"
)
foreach ($nome in $obsoletos) {
  $alvo = Join-Path $destino $nome
  if (Test-Path $alvo) { Remove-Item $alvo -Force -Recurse }
}

$mesmaPasta = $false
try { $mesmaPasta = ((Resolve-Path $origem).Path -eq (Resolve-Path $destino).Path) } catch {}
if (-not $mesmaPasta) {
  $preservar = @("wrangler.jsonc", ".dev.vars", ".git", ".wrangler", "node_modules")
  Get-ChildItem -Force $origem | Where-Object { $preservar -notcontains $_.Name } | ForEach-Object {
    Copy-Item $_.FullName -Destination $destino -Recurse -Force
  }
}

Write-Host "TVDE Gest atualizado e Explorer limpo. D1, secrets, Git e node_modules foram preservados." -ForegroundColor Green
