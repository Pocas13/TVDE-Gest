$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $projectRoot "public\index.html"

if (-not (Test-Path $htmlPath)) {
  throw "Não encontrei public\index.html. Executa este script dentro do projeto TVDE Gest."
}

$content = Get-Content $htmlPath -Raw -Encoding UTF8
$old = "const platforms=Array.from(new Set([...(existing?.plataformas||[]),'Bolt']));"
$new = "const plataformas=Array.from(new Set([...(existing?.plataformas||[]),'Bolt']));"

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  Set-Content $htmlPath -Value $content -Encoding UTF8
  Write-Host "Erro 'plataformas is not defined' corrigido." -ForegroundColor Green
} elseif ($content.Contains($new)) {
  Write-Host "A correção já está aplicada." -ForegroundColor Yellow
} else {
  throw "Não encontrei a linha esperada. O ficheiro pode pertencer a outra versão."
}

Push-Location $projectRoot
try {
  npm run check
} finally {
  Pop-Location
}
