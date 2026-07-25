$ErrorActionPreference = "Stop"
$origem = Split-Path -Parent $MyInvocation.MyCommand.Path
$destino = "D:\TVDE Gest"

if ((Resolve-Path $origem).Path -eq (Resolve-Path $destino -ErrorAction SilentlyContinue).Path) {
  Write-Host "Os ficheiros já estão em D:\TVDE Gest. Não é necessário copiar." -ForegroundColor Yellow
  exit 0
}

New-Item -ItemType Directory -Force -Path $destino | Out-Null
$preservar = @("wrangler.jsonc", ".dev.vars", ".git", ".wrangler", "node_modules")
Get-ChildItem -Force $origem | Where-Object { $preservar -notcontains $_.Name } | ForEach-Object {
  Copy-Item $_.FullName -Destination $destino -Recurse -Force
}
Write-Host "TVDE Gest atualizado. Configuração D1, secrets e Git foram preservados." -ForegroundColor Green
