# Studio 57 - Sync LAB para PROD
# Uso: powershell -ExecutionPolicy Bypass -File supabase\sync-to-prod.ps1

$LAB_DIR   = "C:\Projetos\elo57-lab-saas"
$TEMP_DIR  = "C:\Temp\studio57-prod-sync"
$PROD_REPO = "https://github.com/rannicamp/studio57so-v8.git"

Write-Host "=== Studio 57: Sync LAB -> PROD ===" -ForegroundColor Cyan

# 1. Criar pasta temporaria
Write-Host "[1/5] Preparando pasta temporaria..." -ForegroundColor Yellow
if (Test-Path $TEMP_DIR) { Remove-Item $TEMP_DIR -Recurse -Force }
New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null

# 2. Copiar arquivos excluindo pastas sensiveis
Write-Host "[2/5] Copiando projeto (excluindo landingpages e outros)..." -ForegroundColor Yellow

robocopy $LAB_DIR $TEMP_DIR /E /NFL /NDL /NJH /NJS `
    /XD "$LAB_DIR\app\(landingpages)" `
    /XD "$LAB_DIR\node_modules" `
    /XD "$LAB_DIR\.next" `
    /XD "$LAB_DIR\.git" `
    /XD "$LAB_DIR\supabase\.turbo" `
    /XF "db-sync.conf" "sync_output.sql" "*.log"

Write-Host "[3/5] Arquivos copiados!" -ForegroundColor Green

# 3. Inicializar git no destino
Write-Host "[4/5] Configurando Git..." -ForegroundColor Yellow
Set-Location $TEMP_DIR

git init
git remote add origin $PROD_REPO 2>$null
git remote set-url origin $PROD_REPO 2>$null

# 4. Garantir .gitignore seguro
$gi = ".gitignore"
if (Test-Path $gi) {
    $c = Get-Content $gi -Raw
    if ($c -notmatch "db-sync") {
        Add-Content $gi "`n# Sinc prod`nsupabase/db-sync.conf`nsupabase/sync_output.sql`nsupabase/apply-to-prod.js`nsupabase/apply-functions.js`nsupabase/sync-schema.js"
    }
}

# 5. Commit e push forcado
Write-Host "[5/5] Enviando para studio57so-v8..." -ForegroundColor Yellow
git add .
$ts = Get-Date -Format "dd/MM/yyyy HH:mm"
git commit -m "sync: lab -> prod ($ts)"
git push origin main --force

Write-Host ""
Write-Host "=== SYNC CONCLUIDO COM SUCESSO! ===" -ForegroundColor Green
Write-Host "Repo: $PROD_REPO" -ForegroundColor Green

Set-Location $LAB_DIR
