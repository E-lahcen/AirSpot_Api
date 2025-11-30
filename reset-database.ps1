# Database Reset Script for AirSpot API
# This script will completely reset your database and run all migrations

Write-Host "`n🚨 DATABASE RESET SCRIPT" -ForegroundColor Red
Write-Host "========================`n" -ForegroundColor Red

Write-Host "⚠️  WARNING: This will DELETE ALL DATA in your database!`n" -ForegroundColor Yellow

$confirmation = Read-Host "Are you sure you want to continue? Type 'YES' to confirm"

if ($confirmation -ne 'YES') {
    Write-Host "`n❌ Reset cancelled." -ForegroundColor Red
    exit
}

Write-Host "`n✅ Starting database reset...`n" -ForegroundColor Green

# Configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_USER = "postgres"
$DB_NAME = "airspot"

# Step 1: Stop application
Write-Host "📍 Step 1: Stopping application..." -ForegroundColor Cyan
try {
    docker compose -f docker-compose.local.yml down 2>$null
    Write-Host "   ✓ Application stopped`n" -ForegroundColor Green
} catch {
    Write-Host "   ℹ Application was not running`n" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Step 2: Start PostgreSQL
Write-Host "📍 Step 2: Starting PostgreSQL..." -ForegroundColor Cyan
docker compose -f docker-compose.local.yml up -d postgres
Start-Sleep -Seconds 5
Write-Host "   ✓ PostgreSQL started`n" -ForegroundColor Green

# Step 3: Drop database
Write-Host "📍 Step 3: Dropping existing database..." -ForegroundColor Cyan
$dropCmd = "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec airspot-postgres psql -U $DB_USER -c $dropCmd
Write-Host "   ✓ Database dropped`n" -ForegroundColor Green

# Step 4: Create database
Write-Host "📍 Step 4: Creating new database..." -ForegroundColor Cyan
$createCmd = "CREATE DATABASE $DB_NAME;"
docker exec airspot-postgres psql -U $DB_USER -c $createCmd
Write-Host "   ✓ Database created`n" -ForegroundColor Green

# Step 5: Enable UUID extension
Write-Host "📍 Step 5: Enabling UUID extension..." -ForegroundColor Cyan
$uuidCmd = "CREATE EXTENSION IF NOT EXISTS \`"uuid-ossp\`";"
docker exec airspot-postgres psql -U $DB_USER -d $DB_NAME -c $uuidCmd
Write-Host "   ✓ UUID extension enabled`n" -ForegroundColor Green

# Step 6: Build application
Write-Host "📍 Step 6: Building application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Application built successfully`n" -ForegroundColor Green
} else {
    Write-Host "   ✗ Build failed!`n" -ForegroundColor Red
    exit 1
}

# Step 7: Run migrations
Write-Host "📍 Step 7: Running migrations..." -ForegroundColor Cyan
npm run migration:run
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Migrations executed successfully`n" -ForegroundColor Green
} else {
    Write-Host "   ✗ Migrations failed!`n" -ForegroundColor Red
    exit 1
}

# Step 8: Show migration status
Write-Host "📍 Step 8: Verifying migrations..." -ForegroundColor Cyan
npm run migration:show
Write-Host ""

# Step 9: Ask if user wants to start the application
Write-Host "📍 Step 9: Start application?" -ForegroundColor Cyan
$startApp = Read-Host "Do you want to start the application now? (y/n)"

if ($startApp -eq 'y' -or $startApp -eq 'Y') {
    Write-Host "`nStarting application..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop when ready`n" -ForegroundColor Yellow
    npm run start:local
} else {
    Write-Host "`n✅ Database reset complete!" -ForegroundColor Green
    Write-Host "`nTo start the application, run:" -ForegroundColor Cyan
    Write-Host "   npm run start:local`n" -ForegroundColor White
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✨ Your database is now fresh and ready!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Register your first organization at:" -ForegroundColor White
Write-Host "   http://localhost:3000/api/docs" -ForegroundColor Yellow
Write-Host "2. Use POST /api/v1/auth/register endpoint" -ForegroundColor White
Write-Host "3. Start building your application!`n" -ForegroundColor White
