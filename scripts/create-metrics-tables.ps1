# Create Campaign Metrics Tables Script
# This script executes the SQL to create the metrics tables

param(
    [string]$DbHost = $env:DB_HOST,
    [string]$DbPort = $env:DB_PORT,
    [string]$DbName = $env:DB_NAME,
    [string]$DbUser = $env:DB_USERNAME,
    [string]$DbPassword = $env:DB_PASSWORD
)

# Load .env file if it exists
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            if (-not (Get-Variable -Name $name -ErrorAction SilentlyContinue)) {
                Set-Variable -Name $name -Value $value -Scope Script
            }
        }
    }
    
    if (-not $DbHost) { $DbHost = $DB_HOST }
    if (-not $DbPort) { $DbPort = $DB_PORT }
    if (-not $DbName) { $DbName = $DB_NAME }
    if (-not $DbUser) { $DbUser = $DB_USERNAME }
    if (-not $DbPassword) { $DbPassword = $DB_PASSWORD }
}

Write-Host "Creating campaign metrics tables..." -ForegroundColor Cyan
Write-Host "Database: $DbName on $DbHost:$DbPort" -ForegroundColor Gray

# Set PGPASSWORD environment variable for psql
$env:PGPASSWORD = $DbPassword

try {
    # Execute the SQL script
    $result = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f "scripts/create-metrics-tables.sql" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Campaign metrics tables created successfully!" -ForegroundColor Green
        Write-Host $result
    } else {
        Write-Host "✗ Error creating tables:" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "You can now restart your application with: pnpm run start:dev" -ForegroundColor Yellow
