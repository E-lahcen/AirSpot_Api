# Database Reset Guide - Start Fresh

This guide will help you completely reset your database and start over from scratch.

## ⚠️ WARNING

**This process will DELETE ALL DATA in your database!**

- Only do this if you're absolutely sure
- Make a backup first if you have any data you want to keep
- This is safe for development, but NEVER do this in production without a backup

## Prerequisites

- PostgreSQL is running
- You have database admin credentials
- Application is stopped

## Step-by-Step Reset Process

### Step 1: Stop the Application

```bash
# If running locally
# Press Ctrl+C to stop the application

# If using Docker
docker compose -f docker-compose.local.yml down
```

### Step 2: Backup Current Database (Optional but Recommended)

```bash
# Set your database credentials
$env:DB_HOST="localhost"  # or your DB host
$env:DB_PORT="5432"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
$env:DB_NAME="airspot"

# Create backup (optional)
pg_dump -h $env:DB_HOST -U $env:DB_USERNAME -d $env:DB_NAME > backup_before_reset_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### Step 3: Drop and Recreate Database

#### Option A: Using psql (Recommended)

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres

# In psql console:
# Drop the database (this deletes everything)
DROP DATABASE IF EXISTS airspot;

# Recreate empty database
CREATE DATABASE airspot;

# Enable UUID extension
\c airspot
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit psql
\q
```

#### Option B: Using pgAdmin

1. Open pgAdmin at `http://localhost:5050`
2. Connect to your PostgreSQL server
3. Right-click on `airspot` database → Delete/Drop
4. Right-click on Databases → Create → Database
5. Name it `airspot` and save

### Step 4: Verify Database is Empty

```bash
# Connect to the database
psql -h localhost -U postgres -d airspot

# Check for tables (should be empty except system tables)
\dt

# You should see: "Did not find any relations."

# Exit
\q
```

### Step 5: Build the Application

```bash
# Navigate to project directory
cd c:\Users\pc\Desktop\Projects\AirSpot_Api-1

# Install dependencies (if needed)
npm install

# Build the application
npm run build
```

### Step 6: Run Migrations

Now run the migrations to create all tables:

```bash
# Run all migrations
npm run migration:run
```

**Expected output:**

```
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = 'public' AND "table_name" = 'migrations'
query: CREATE TABLE "migrations" (...)
query: SELECT * FROM "migrations" "migrations" ORDER BY "id" DESC
Migration InitialSchema1732233600000 has been executed successfully.
Migration UpdateTenantEntity1763914988652 has been executed successfully.
...
```

### Step 7: Verify Migrations

```bash
# Check migration status
npm run migration:show
```

**Expected output:**

```
[X] InitialSchema1732233600000
[X] UpdateTenantEntity1763914988652
[X] RemoveTenantOwnerFk1763916003624
[X] RemoveOrganisationFromEntities1763917837527
[X] AddOwnerIdToEntities1763919549258
[X] AddOrganizationMetadataToTenants1764243000000
[X] UserTenantEntity1764414355796
[X] UserTenantEntityUpdated1764415176775
[X] TemplateStoryboardEntities1764438816992
[X] CreativeEntityUpdate1764451387072
[X] CreativeModificationTest1764457409357
```

All migrations should show `[X]` (executed).

### Step 8: Verify Database Schema

```bash
# Connect to database
psql -h localhost -U postgres -d airspot

# List all tables
\dt

# You should see tables like:
# - migrations
# - tenants
# - users
# - roles
# - user_roles
# - user_tenant
# - invitations
# etc.

# Check a specific table structure
\d users

# Exit
\q
```

### Step 9: Run Tenant Migrations

Since you're using multi-tenancy, you need to set up tenant schemas:

```bash
# This will create schemas for any existing tenants
npm run tenant:migrate
```

**Note:** If you have no tenants yet, this is fine. Tenant schemas will be created automatically when you register your first organization.

### Step 10: Start the Application

```bash
# For local development with Docker
npm run start:local

# OR for development without Docker
npm run start:dev

# OR for production
npm run start:prod
```

**Expected startup logs:**

```
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] AppController {/}:
[Nest] INFO [NestApplication] Nest application successfully started
🔄 Running tenant schema migrations on startup...
✅ No tenant migrations needed (no tenants yet)
```

### Step 11: Create Your First User/Tenant

Now you can register your first organization and user:

```bash
# Using curl (PowerShell)
$body = @{
    email = "admin@example.com"
    password = "SecurePass123!"
    fullName = "Admin User"
    organizationName = "My Organization"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**OR using the API docs:**

1. Open `http://localhost:3000/api/docs`
2. Find `POST /api/v1/auth/register`
3. Click "Try it out"
4. Fill in the details and execute

### Step 12: Verify Everything Works

```bash
# Check the database again
psql -h localhost -U postgres -d airspot

# List all schemas (you should see your tenant schema)
\dn

# You should see:
# - public (main schema)
# - tenant_my_organization (or similar)

# Check tables in public schema
\dt

# Check tables in tenant schema
\dt tenant_my_organization.*

# Exit
\q
```

## Troubleshooting

### Issue: "database is being accessed by other users"

**Solution:**

```bash
# Connect to postgres database (not airspot)
psql -h localhost -U postgres -d postgres

# Terminate all connections to airspot database
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'airspot' AND pid <> pg_backend_pid();

# Now try dropping again
DROP DATABASE airspot;
```

### Issue: Migration fails with "relation already exists"

**Solution:**

```bash
# The database wasn't properly cleaned
# Drop and recreate the database again (Step 3)
# Make sure to drop ALL schemas:

psql -h localhost -U postgres -d airspot

# Drop all tenant schemas
DROP SCHEMA IF EXISTS tenant_* CASCADE;

# Drop public schema and recreate
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

# Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

\q
```

### Issue: "uuid-ossp extension does not exist"

**Solution:**

```bash
psql -h localhost -U postgres -d airspot

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

### Issue: TypeORM can't find migrations

**Solution:**

```bash
# Make sure you built the application first
npm run build

# Check that migration files exist
ls dist/migrations/

# Run migrations again
npm run migration:run
```

## Quick Reset Script

For faster resets in development, you can use this PowerShell script:

```powershell
# Save as reset-database.ps1

Write-Host "🗑️  Resetting database..." -ForegroundColor Yellow

# Stop application
Write-Host "Stopping application..." -ForegroundColor Cyan
docker compose -f docker-compose.local.yml down

# Wait a moment
Start-Sleep -Seconds 2

# Start only database
Write-Host "Starting PostgreSQL..." -ForegroundColor Cyan
docker compose -f docker-compose.local.yml up -d postgres

# Wait for PostgreSQL to be ready
Start-Sleep -Seconds 5

# Drop and recreate database
Write-Host "Dropping and recreating database..." -ForegroundColor Cyan
docker exec -it airspot-postgres psql -U postgres -c "DROP DATABASE IF EXISTS airspot;"
docker exec -it airspot-postgres psql -U postgres -c "CREATE DATABASE airspot;"
docker exec -it airspot-postgres psql -U postgres -d airspot -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Build application
Write-Host "Building application..." -ForegroundColor Cyan
npm run build

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Cyan
npm run migration:run

# Start application
Write-Host "Starting application..." -ForegroundColor Cyan
npm run start:local

Write-Host "✅ Database reset complete!" -ForegroundColor Green
```

**Usage:**

```powershell
.\reset-database.ps1
```

## Summary Checklist

- [ ] Application stopped
- [ ] Backup created (if needed)
- [ ] Database dropped
- [ ] Database recreated
- [ ] UUID extension enabled
- [ ] Application built
- [ ] Migrations executed
- [ ] Migration status verified
- [ ] Tenant migrations run (if needed)
- [ ] Application started
- [ ] First user registered
- [ ] Everything working

## What You Should Have Now

After completing these steps, you should have:

✅ Empty, clean database
✅ All migration tables created
✅ Public schema with shared tables (users, tenants, roles, etc.)
✅ Migrations table tracking all executed migrations
✅ Ready to create your first tenant/organization
✅ Clean slate to start development

## Next Steps

1. **Register your first organization** via `/api/v1/auth/register`
2. **Login** via `/api/v1/auth/login`
3. **Start creating campaigns, creatives, etc.**

## Important Notes

- **Development**: This process is safe and can be repeated as needed
- **Staging**: Only do this if you're sure you want to lose all test data
- **Production**: NEVER do this without a complete backup and approval from your team

---

**Need help?** Check the main README.md or the migration documentation in `src/migrations/README.md`
