$ErrorActionPreference = "Stop"
$repo = "https://github.com/Pocas13/TVDE-Gest.git"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "O Git não está instalado ou não está disponível no PATH."
}

if (-not (Test-Path ".git")) {
  git init
}

git branch -M main

$origin = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
  if ($origin -ne $repo) {
    git remote set-url origin $repo
    Write-Host "Remote origin corrigido para $repo"
  } else {
    Write-Host "Remote origin já está correto."
  }
} else {
  git remote add origin $repo
  Write-Host "Remote origin criado: $repo"
}

Write-Host ""
Write-Host "Configuração concluída. Próximos comandos:"
Write-Host "  git add ."
Write-Host '  git commit -m "Projeto inicial TVDE Gest"'
Write-Host "  git push -u origin main"
