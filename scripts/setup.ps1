# Pełna konfiguracja lokalna przed deployem na Vercel.
# Uruchomienie: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "`n[1/4] Instalacja zależności..."
npm install

if (-not (Test-Path ".env")) {
  Write-Host "`n[2/4] Tworzenie .env z .env.example..."
  Copy-Item ".env.example" ".env"
  node scripts/gen-creds.mjs
  Write-Host "Uzupełnij DATABASE_URL w .env (Neon / Vercel Postgres), potem uruchom skrypt ponownie."
  exit 0
}

Write-Host "`n[2/4] .env istnieje — OK"

Write-Host "`n[3/4] Migracja schematu bazy (drizzle push)..."
npm run db:push
if ($LASTEXITCODE -ne 0) {
  Write-Error "db:push nie powiodło się — sprawdź DATABASE_URL w .env"
}

Write-Host "`n[4/4] Build produkcyjny (Vercel)..."
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Error "Build nie powiódł się"
}

Write-Host @"

=== Lokalnie gotowe ===

Następne kroki (Vercel):
  1. npx vercel login
  2. npx vercel link
  3. npm run setup:vercel
  4. W Vercel Dashboard: Storage -> Blob -> Create Store
  5. npm run deploy

Panel admina: /admin/login
Haslo domyslne: admin123 (zmien w .env: npm run gen:creds)

"@
