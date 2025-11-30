# Quick Start - Fresh Database Setup

## 🚀 Fastest Way (Automated)

```powershell
# Run the automated reset script
.\reset-database.ps1
```

This script will:

- ✅ Stop the application
- ✅ Drop and recreate the database
- ✅ Enable required extensions
- ✅ Build the application
- ✅ Run all migrations
- ✅ Optionally start the application

---

## 📋 Manual Steps (If you prefer step-by-step)

### 1. Stop Application

```powershell
docker compose -f docker-compose.local.yml down
```

### 2. Start PostgreSQL Only

```powershell
docker compose -f docker-compose.local.yml up -d postgres
```

### 3. Reset Database

```powershell
# Drop database
docker exec airspot-postgres psql -U postgres -c "DROP DATABASE IF EXISTS airspot;"

# Create database
docker exec airspot-postgres psql -U postgres -c "CREATE DATABASE airspot;"

# Enable UUID extension
docker exec airspot-postgres psql -U postgres -d airspot -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### 4. Build & Migrate

```powershell
# Build
npm run build

# Run migrations
npm run migration:run

# Verify
npm run migration:show
```

### 5. Start Application

```powershell
npm run start:local
```

---

## ✅ Verification Checklist

After reset, verify:

```powershell
# Check database exists
docker exec airspot-postgres psql -U postgres -l

# Check tables were created
docker exec airspot-postgres psql -U postgres -d airspot -c "\dt"

# Check migrations
npm run migration:show
```

All migrations should show `[X]`.

---

## 🎯 First Steps After Reset

### 1. Register First Organization

**Using API Docs (Recommended):**

1. Open http://localhost:3000/api/docs
2. Find `POST /api/v1/auth/register`
3. Click "Try it out"
4. Fill in:
   ```json
   {
     "email": "admin@example.com",
     "password": "SecurePass123!",
     "fullName": "Admin User",
     "organizationName": "My Company"
   }
   ```
5. Execute

**Using PowerShell:**

```powershell
$body = @{
    email = "admin@example.com"
    password = "SecurePass123!"
    fullName = "Admin User"
    organizationName = "My Company"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 2. Login

```powershell
$body = @{
    email = "admin@example.com"
    password = "SecurePass123!"
    tenantSlug = "my-company"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Save the access token
$token = $response.accessToken
```

### 3. Test Authenticated Request

```powershell
# Get campaigns (should be empty)
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/campaigns" `
    -Headers @{Authorization = "Bearer $token"}
```

---

## 🔧 Troubleshooting

### Database connection refused

```powershell
# Check if PostgreSQL is running
docker ps | Select-String postgres

# If not running, start it
docker compose -f docker-compose.local.yml up -d postgres
```

### Migrations fail

```powershell
# Make sure you built first
npm run build

# Check migration files exist
ls dist/migrations/

# Try again
npm run migration:run
```

### Port already in use

```powershell
# Check what's using port 3000
netstat -ano | Select-String ":3000"

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

---

## 📚 Full Documentation

For detailed information, see:

- **DATABASE_RESET_GUIDE.md** - Complete reset guide
- **README.md** - General project documentation
- **src/migrations/README.md** - Migration documentation

---

## ⚡ Common Commands

```powershell
# Development
npm run start:dev          # Start in dev mode (no Docker)
npm run start:local        # Start with Docker

# Migrations
npm run migration:show     # Check migration status
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration

# Database
npm run tenant:migrate     # Run tenant migrations
npm run tenant:sync        # Sync tenant migrations

# Build
npm run build              # Build application
npm run lint               # Lint code
npm run format             # Format code
```

---

**Ready to start fresh? Run:**

```powershell
.\reset-database.ps1
```
