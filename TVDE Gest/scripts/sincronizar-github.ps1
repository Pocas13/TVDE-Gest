$ErrorActionPreference = "Stop"
Set-Location "D:\TVDE Gest"
git status
git add .
git commit -m "Atualiza TVDE Gest" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "Sem alterações novas para commit." -ForegroundColor Yellow }
git push origin main
