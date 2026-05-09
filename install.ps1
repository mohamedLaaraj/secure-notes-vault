# ================================================================
# SECURE NOTES VAULT — Automated Laravel Setup Script
# Run this from PowerShell inside your project folder
# Usage: .\install.ps1
# ================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SECURE NOTES VAULT — Laravel Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── STEP 1: Create Laravel project ──────────────────────────────
Write-Host "[1/7] Creating Laravel project..." -ForegroundColor Yellow
composer create-project laravel/laravel:^11.0 laravel-backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: composer failed. Make sure Composer is installed." -ForegroundColor Red
    exit 1
}

# ── STEP 2: Copy our files into Laravel ─────────────────────────
Write-Host ""
Write-Host "[2/7] Copying backend files into Laravel..." -ForegroundColor Yellow

$src = "$PSScriptRoot\backend-files"
$dst = "$PSScriptRoot\laravel-backend"

Copy-Item "$src\AuthController.php"              "$dst\app\Http\Controllers\" -Force
Copy-Item "$src\NoteController.php"              "$dst\app\Http\Controllers\" -Force
Copy-Item "$src\Note.php"                        "$dst\app\Models\" -Force
Copy-Item "$src\2024_01_01_000000_create_notes_table.php" "$dst\database\migrations\" -Force
Copy-Item "$src\api.php"                         "$dst\routes\" -Force
Copy-Item "$src\cors.php"                        "$dst\config\" -Force

Write-Host "Files copied successfully." -ForegroundColor Green

# ── STEP 3: Install Sanctum ──────────────────────────────────────
Write-Host ""
Write-Host "[3/7] Installing Laravel Sanctum..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\laravel-backend"
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# ── STEP 4: Configure .env ───────────────────────────────────────
Write-Host ""
Write-Host "[4/7] Configuring .env file..." -ForegroundColor Yellow

$envPath = "$PSScriptRoot\laravel-backend\.env"
$envContent = Get-Content $envPath -Raw

$envContent = $envContent -replace 'DB_DATABASE=laravel', 'DB_DATABASE=secure_vault'
$envContent = $envContent -replace 'DB_USERNAME=root', 'DB_USERNAME=root'
$envContent = $envContent -replace 'DB_PASSWORD=', 'DB_PASSWORD='

Set-Content $envPath $envContent
Write-Host ".env configured (DB: secure_vault, User: root, Password: empty)" -ForegroundColor Green
Write-Host "NOTE: If your MySQL password is not empty, edit laravel-backend\.env manually." -ForegroundColor Yellow

# ── STEP 5: Generate app key ─────────────────────────────────────
Write-Host ""
Write-Host "[5/7] Generating application key..." -ForegroundColor Yellow
php artisan key:generate

# ── STEP 6: Run migrations ───────────────────────────────────────
Write-Host ""
Write-Host "[6/7] Running database migrations..." -ForegroundColor Yellow
Write-Host "Make sure MySQL is running (start XAMPP and click Start next to MySQL)" -ForegroundColor Yellow
Write-Host ""
php artisan migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Migration failed. Common fixes:" -ForegroundColor Red
    Write-Host "  1. Open XAMPP and START MySQL" -ForegroundColor White
    Write-Host "  2. Go to http://localhost/phpmyadmin -> New -> create database 'secure_vault'" -ForegroundColor White
    Write-Host "  3. Edit laravel-backend\.env and set the correct DB_PASSWORD" -ForegroundColor White
    Write-Host "  4. Run: php artisan migrate" -ForegroundColor White
    exit 1
}

# ── STEP 7: Start server ─────────────────────────────────────────
Write-Host ""
Write-Host "[7/7] Starting Laravel development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  API running at: http://127.0.0.1:8000/api" -ForegroundColor Cyan
Write-Host "  Open your frontend: frontend/1_notes.html with Live Server" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Keep this terminal open!" -ForegroundColor Yellow
Write-Host ""
php artisan serve
