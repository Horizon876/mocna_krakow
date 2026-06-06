# Wgrywa zmienne z .env do Vercel (production + preview + development).
# Wymaga: npx vercel login + npx vercel link (w katalogu projektu)
#
# Uruchomienie:
#   powershell -ExecutionPolicy Bypass -File scripts/setup-vercel-env.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".env")) {
  Write-Error "Brak pliku .env — skopiuj .env.example i uzupełnij wartości."
}

$envMap = @{}
Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)\s*=\s*"?([^"#]+)"?\s*') {
    $name = $matches[1]
    $val = $matches[2].Trim()
    if ($val) { $envMap[$name] = $val }
  }
}

$vars = @("DATABASE_URL", "SESSION_SECRET", "ADMIN_PASSWORD_HASH_B64", "BLOB_READ_WRITE_TOKEN")
$envs = @("production", "preview", "development")

Write-Host "Sprawdzam logowanie Vercel..."
npx vercel whoami
if ($LASTEXITCODE -ne 0) {
  Write-Host "Zaloguj się: npx vercel login"
  exit 1
}

if (-not (Test-Path ".vercel/project.json")) {
  Write-Host "Łączenie projektu..."
  npx vercel link --yes
}

foreach ($name in $vars) {
  if (-not $envMap.ContainsKey($name) -or -not $envMap[$name]) {
    if ($name -eq "BLOB_READ_WRITE_TOKEN") {
      Write-Host "Pomijam $name (dodaj po utworzeniu Blob Storage w Vercel)"
      continue
    }
    Write-Error "Brak wartości dla $name w .env"
  }
  $value = $envMap[$name]
  foreach ($target in $envs) {
    Write-Host "Ustawiam $name ($target)..."
    $value | npx vercel env add $name $target --force 2>&1 | Out-Null
  }
}

Write-Host "`nGotowe. Deploy: npx vercel --prod"
