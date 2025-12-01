# Production Migration Guide

Complete guide for running, testing, and generating migrations in production multi-tenant environments.

## 🎯 Quick Start

For multi-tenant production environments, use:

```bash
# Run migrations on public schema + ALL tenant schemas
npm run migrate:prod:all
```

This automatically:

- ✅ Runs migrations on public schema first
- ✅ Applies migrations to all active tenant schemas
- ✅ Filters public-only tables (users, roles, tenants, invitations, user_tenant)
- ✅ Tracks migrations separately per schema

## Available Scripts

### NPM Commands

```bash
# Generate new migration
npm run migrate:prod:generate <migration-name>

# Run migrations on public schema only (interactive)
npm run migrate:prod

# Run migrations without prompts (for CI/CD)
npm run migrate:prod:simple

# Run migrations on ALL schemas (public + tenants) 🚀
npm run migrate:prod:all

# Start debug environment
npm run migrate:debug

# Stop debug environment
npm run migrate:debug:down
```

### Direct Script Usage

```bash
# Generate migration
./scripts/generate-migration-prod.sh add-user-phone-number

# Run migration on public schema only
./scripts/migrate-production.sh

# Run simple migration (no prompts)
./scripts/migrate-simple.sh

# Run on ALL schemas (public + all tenants)
./scripts/migrate-all-schemas.sh
```

## Multi-Tenant Architecture

### How It Works

Your application uses a **multi-tenant architecture** with PostgreSQL schemas:

- **Public Schema**: Contains shared tables (`users`, `roles`, `tenants`, `invitations`, `user_tenant`)
- **Tenant Schemas**: Each tenant has a separate schema (e.g., `tenant1_schema`, `tenant2_schema`) containing tenant-specific data (`campaigns`, `templates`, `creatives`, `storyboards`)

### Public-Only Tables

These tables **only exist in the public schema** and are automatically filtered from tenant schemas:

- `tenants` - Tenant registry
- `users` - User accounts
- `roles` - Role definitions
- `user_roles` / `users_roles_roles` - Role assignments
- `invitations` - User invitations
- `user_tenant` - User-tenant relationships

### Tenant-Specific Tables

These tables exist in **each tenant schema**:

- `campaigns` - Marketing campaigns
- `templates` - Campaign templates
- `creatives` - Creative assets
- `storyboards` - Storyboard data
- `ad_variations` - Ad variations
- `audiences` - Audience targeting

## The Problem (Fixed)

The production migration script was failing because:

- ❌ Used npm scripts requiring TypeScript tools (not available in prod)
- ❌ Pointed to `.ts` files instead of compiled `.js` files
- ❌ Couldn't find TypeORM CLI in production environment
- ❌ No automated way to sync migrations across tenant schemas

## The Solution

### Auto-Detecting Migration Scripts

All migration scripts now:

- ✅ Auto-detect production (compiled) vs development (TypeScript) environment
- ✅ Use correct TypeORM CLI path for each environment
- ✅ Point to the right data-source file (`.js` in prod, `.ts` in dev)
- ✅ **NEW**: Automatically apply migrations to all tenant schemas
- ✅ **NEW**: Filter public-only tables from tenant schemas using query interception

### Debug Environment

Use `docker-compose.migration-debug.yml` to:

- Test migrations in production-like environment
- Verify migrations work before deploying
- Debug issues safely

## Complete Workflow

### 1. Generate a New Migration

```bash
# Using npm (recommended)
npm run migrate:prod:generate add-user-phone-number

# Or directly
./scripts/generate-migration-prod.sh add-user-phone-number
```

This will:

- Auto-detect your environment
- Generate migration with timestamp
- Create file in appropriate directory (src/migrations or dist/src/migrations)

### 2. Test Locally First (Recommended)

```bash
# Start debug environment
npm run migrate:debug

# Or manually
docker compose -f docker-compose.migration-debug.yml build
docker compose -f docker-compose.migration-debug.yml up -d

# Run multi-tenant migration test
docker compose -f docker-compose.migration-debug.yml exec api sh scripts/migrate-all-schemas.sh

# Clean up
npm run migrate:debug:down
```

### 3. Deploy to Production (Multi-Tenant)

**Recommended: Multi-Tenant Migration** 🎯

```bash
# SSH into production
fly ssh console -a your-app

# Navigate to app directory
cd /app

# Run on ALL schemas (public + all tenants)
npm run migrate:prod:all
# OR
./scripts/migrate-all-schemas.sh
```

This will:

1. Run migrations on public schema
2. Detect all active tenant schemas
3. Apply migrations to each tenant schema
4. Automatically filter public-only tables
5. Track migrations separately per schema

**Alternative: Public Schema Only**

```bash
# For public schema migrations only
npm run migrate:prod
# OR
./scripts/migrate-production.sh
```

**For CI/CD: Automated Migration**

```bash
# No prompts, auto-apply
npm run migrate:prod:simple
# OR
./scripts/migrate-simple.sh
```

### Manual Commands

**Build and start containers:**

```bash
docker compose -f docker-compose.migration-debug.yml build
docker compose -f docker-compose.migration-debug.yml up -d
```

**Check container status:**

```bash
docker compose -f docker-compose.migration-debug.yml ps
```

**Access container shell:**

```bash
docker compose -f docker-compose.migration-debug.yml exec api bash
```

**View logs:**

```bash
docker compose -f docker-compose.migration-debug.yml logs -f api
```

**Stop and clean up:**

```bash
docker compose -f docker-compose.migration-debug.yml down -v
```

## Testing Migrations in Production

### Option 1: Using the Interactive Script (Recommended)

```bash
# In your production environment (Fly.io, AWS, etc.)
./scripts/migrate-production.sh
```

The script will:

1. Detect the production environment automatically
2. Show pending migrations
3. Ask for confirmation before running
4. Execute migrations
5. Show final migration status

### Option 2: Direct TypeORM Commands

```bash
# Show migration status
node /app/node_modules/typeorm/cli.js migration:show -d /app/dist/src/config/data-source.js

# Run pending migrations
node /app/node_modules/typeorm/cli.js migration:run -d /app/dist/src/config/data-source.js

# Revert last migration
node /app/node_modules/typeorm/cli.js migration:revert -d /app/dist/src/config/data-source.js
```

## Key Files

### Migration Scripts

- `scripts/generate-migration-prod.sh` - Generate new migrations (environment-aware)
- `scripts/migrate-production.sh` - Interactive migration runner for public schema
- `scripts/migrate-simple.sh` - Simple migration runner (no prompts, for CI/CD)
- `scripts/migrate-all-schemas.sh` - **Multi-tenant migration runner** (public + all tenants)

### Docker Configuration

- `docker-compose.migration-debug.yml` - Debug environment setup
- `docker/Dockerfile.migration-debug` - Production-like build for debugging

## Script Comparison

### migrate-all-schemas.sh (Multi-Tenant) ⭐ RECOMMENDED

✅ Runs on public schema + ALL tenant schemas
✅ Auto-detects all active tenants
✅ Filters public-only tables from tenant schemas
✅ Tracks migrations per schema
✅ Environment validation
✅ Confirmation prompt
**Use for:** Production deployments with multi-tenant architecture

### migrate-production.sh (Public Schema Only)

✅ Environment validation
✅ Two confirmation prompts
✅ Shows pending migrations before running
✅ Shows final status after running
✅ Works in dev and production
❌ Only affects public schema
**Use for:** Public schema-only changes

### migrate-simple.sh (Automated)

✅ Auto-detects paths
✅ Production JavaScript only
❌ No prompts or confirmations
❌ Minimal output
**Use for:** CI/CD pipelines

### generate-migration-prod.sh (Generator)

✅ Requires migration name
✅ Environment validation
✅ Auto-detects environment
✅ Works in dev and production
**Use for:** Creating new migrations

## Production Dockerfile Requirements

For migrations to work in production, your Dockerfile MUST:

1. **Keep dev dependencies** (for building):

   ```dockerfile
   RUN npm ci --include=dev
   ```

2. **Copy node_modules** to final stage:

   ```dockerfile
   COPY --from=build /app/node_modules /app/node_modules
   ```

3. **Include the compiled migrations**:
   ```dockerfile
   COPY --from=build /app/dist /app/dist
   ```

The current `docker/Dockerfile.prod` already has these requirements.

## Troubleshooting

### Migration fails with "data-source not found"

**Problem**: The data-source.js file isn't in the expected location.

**Solution**: Verify the build includes the config directory:

```bash
docker compose -f docker-compose.migration-debug.yml exec api ls -la /app/dist/src/config/
```

### Migration fails with "typeorm: command not found"

**Problem**: TypeORM CLI isn't available.

**Solution**: Use the full path to TypeORM:

```bash
node /app/node_modules/typeorm/cli.js migration:run -d /app/dist/src/config/data-source.js
```

### Entities not found during migration

**Problem**: The data-source.ts is configured for TypeScript entities, not compiled JavaScript.

**Solution**: The data-source already handles this automatically based on `NODE_ENV`:

```typescript
entities: isProduction
  ? ['dist/src/**/entities/*.entity.js']
  : ['src/**/entities/*.entity.ts'];
```

### Public-only tables appearing in tenant schemas

**Problem**: Tables like `users`, `roles`, or `tenants` are being created in tenant schemas.

**Solution**: The `migrate-all-schemas.sh` script automatically filters these tables. If they appear:

1. Check the `publicOnlyTables` array in the script
2. Verify query interception is working
3. Manually remove from tenant schemas:

```sql
-- For each tenant schema
DROP TABLE IF EXISTS "tenant_schema_name".users CASCADE;
DROP TABLE IF EXISTS "tenant_schema_name".roles CASCADE;
DROP TABLE IF EXISTS "tenant_schema_name".tenants CASCADE;
```

### Tenant schema not receiving migrations

**Problem**: New tenant schemas don't have migrations applied.

**Solution**:

```bash
# Run the multi-tenant migration script
npm run migrate:prod:all
```

The script automatically detects all active tenants from the `tenants` table and applies migrations to their schemas.

### Migration tracking out of sync between schemas

**Problem**: Different schemas have different migration histories.

**Solution**: Each schema maintains its own migration table. To check:

```sql
-- Public schema
SELECT * FROM public.migrations;

-- Tenant schema
SELECT * FROM "tenant_schema_name".migrations;
```

To resync, run `npm run migrate:prod:all` which will apply any missing migrations.

## Production Deployment Checklist

Before deploying migrations to production:

- [ ] Test migrations in the debug environment
- [ ] Backup the production database
- [ ] Verify all environment variables are set
- [ ] Check that NODE_ENV=production
- [ ] Review the SQL queries that will be executed
- [ ] **Verify which tables should be public-only vs tenant-specific**
- [ ] **Confirm all active tenants will receive migrations**
- [ ] Have a rollback plan ready
- [ ] Monitor the migration process
- [ ] Verify the application starts successfully after migration
- [ ] **Test with at least one tenant after migration**

## Example Production Migration Flow (Multi-Tenant)

```bash
# 1. Connect to production container (Fly.io example)
fly ssh console -a your-app-name

# 2. Set environment variables if needed
export NODE_ENV=production

# 3. Run the multi-tenant migration script
cd /app
npm run migrate:prod:all
# OR
./scripts/migrate-all-schemas.sh

# 4. Type 'yes' to confirm

# 5. Observe output:
#    - Public schema migrations run
#    - Each tenant schema processed
#    - Public-only tables filtered
#    - Migration count per schema

# 6. Verify migration status
node /app/node_modules/typeorm/cli.js migration:show -d /app/dist/src/config/data-source.js
```

## Notes

- The debug environment uses a separate database (`airspot_migration_test`) to avoid affecting local development
- Migrations in the debug environment are persistent in a Docker volume
- To start fresh, use `docker compose -f docker-compose.migration-debug.yml down -v` to remove volumes
- The production migration script now has a built-in confirmation step to prevent accidental migrations

## Pre-Production Checklist

- [ ] Test in debug environment
- [ ] Backup production database
- [ ] Verify environment variables (NODE_ENV=production)
- [ ] Review migration SQL
- [ ] Have rollback plan ready

## Rollback Procedure

If something goes wrong:

```bash
# Revert last migration
node /app/node_modules/typeorm/cli.js migration:revert -d /app/dist/src/config/data-source.js

# Or restore from backup
fly postgres connect -a your-postgres-app
psql -U postgres your_db_name < backup_file.sql
```

## Common Issues

**"data-source.js not found"**

```bash
ls -la /app/dist/src/config/
# If missing, rebuild with: npm run build
```

**"typeorm not found"**

```bash
# Use full path
node /app/node_modules/typeorm/cli.js migration:run -d /app/dist/src/config/data-source.js
```

**"Cannot connect to database"**

```bash
# Check environment variables
echo $DB_HOST $DB_PORT $DB_NAME
```

**"Public tables appearing in tenant schemas"**

```bash
# The script should filter these automatically
# Check publicOnlyTables array in migrate-all-schemas.sh
```

**"New tenant not getting migrations"**

```bash
# Run multi-tenant migration
npm run migrate:prod:all
# Script auto-detects all active tenants
```

## Team Workflow (Multi-Developer)

### Problem

When multiple developers work on the same codebase:

- Migration conflicts in development
- Production migrations need to be centralized
- Team needs consistent migration process

### Solution

**Step 1: Generate migrations on PRODUCTION server**

```bash
# SSH to production
fly ssh console -a your-app

# Generate migration based on entity changes
npm run migrate:prod:generate DescribeYourChanges
```

**Step 2: Migration is created on server**

The migration file is generated in production based on the **actual database state** vs **entity definitions**.

**Step 3: Apply to all schemas**

```bash
# Still on production server
npm run migrate:prod:all
```

**Step 4: Commit the migration file**

Download or copy the generated migration file from production to your repository and commit it.

**Benefits:**

- ✅ Single source of truth (production database)
- ✅ No conflicts between developers
- ✅ Migrations match actual production state
- ✅ All tenant schemas stay in sync
- ✅ Isolated from development environment issues

## Related Documentation

- [Database Reset Guide](./DATABASE_RESET_GUIDE.md)
- [Entity Relationships](./ENTITY_RELATIONSHIPS.md)
- [Architecture](./ARCHITECTURE.md)
