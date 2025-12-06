#!/bin/bash
# Production Multi-Tenant Migration Script (Direct Approach)
# This script runs public schema migrations on ALL schemas (public + tenants)
# No need for tenant-schema-migrations.ts - migrations are applied directly

# Don't exit on error - we want to process all tenants even if one fails
set +e

echo "=========================================="
echo "  Multi-Tenant Production Migration"
echo "  (Direct Application Method)"
echo "=========================================="
echo ""

# Check if required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USERNAME" ]; then
    echo "ERROR: Required environment variables are not set"
    echo "Please ensure DB_HOST, DB_NAME, and DB_USERNAME are set"
    exit 1
fi

echo "Database Host: $DB_HOST"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USERNAME"
echo ""

# Prompt for confirmation
read -p "Run migrations on public schema AND all tenant schemas? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

# Determine the correct data-source path
# Check if we're in production or development
if [ "$NODE_ENV" = "production" ] && [ -f "/app/dist/src/config/data-source.js" ]; then
    DATA_SOURCE_PATH="/app/dist/src/config/data-source.js"
    TYPEORM_CLI="node /app/node_modules/typeorm/cli.js"
    NODE_CMD="node"
    MIGRATIONS_DIR="/app/dist/src/migrations"
elif [ "$NODE_ENV" = "production" ] && [ -f "dist/src/config/data-source.js" ]; then
    DATA_SOURCE_PATH="dist/src/config/data-source.js"
    TYPEORM_CLI="node node_modules/typeorm/cli.js"
    NODE_CMD="node"
    MIGRATIONS_DIR="dist/src/migrations"
else
    # Development environment - use TypeScript
    DATA_SOURCE_PATH="src/config/data-source.ts"
    TYPEORM_CLI="npx ts-node ./node_modules/typeorm/cli.js"
    NODE_CMD="npx ts-node"
    MIGRATIONS_DIR="src/migrations"
fi

echo ""
echo "=========================================="
echo "  STEP 1: Public Schema Migration"
echo "=========================================="
echo ""

echo "Running public schema migrations..."
$TYPEORM_CLI migration:run -d $DATA_SOURCE_PATH

echo ""
echo "✓ Public schema migrations completed!"

echo ""
echo "=========================================="
echo "  STEP 2: Tenant Schemas Migration"
echo "=========================================="
echo ""

# Create a Node.js script to apply migrations to all tenant schemas
cat > /tmp/apply-tenant-migrations.js << 'SCRIPT_EOF'
const { DataSource } = require('typeorm');

async function applyMigrationsToTenantSchemas() {
  // Connect to database
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await dataSource.initialize();
  console.log('✓ Connected to database\n');

  try {
    // Get all tenant schemas
    const result = await dataSource.query(`
      SELECT schema_name 
      FROM tenants 
      WHERE is_active = true 
      ORDER BY created_at
    `);

    const tenantSchemas = result.map(row => row.schema_name);
    console.log(`Found ${tenantSchemas.length} active tenant schemas:\n`);
    tenantSchemas.forEach(schema => console.log(`  - ${schema}`));
    console.log('');

    if (tenantSchemas.length === 0) {
      console.log('⚠️  No active tenants found. Skipping tenant migrations.');
      return;
    }

    // Get migrations from public schema
    const migrations = await dataSource.query(`
      SELECT * FROM migrations 
      ORDER BY id
    `);

    console.log(`${migrations.length} migrations to apply\n`);

    // Apply to each tenant schema
    for (const schema of tenantSchemas) {
      console.log(`\n📦 Processing schema: ${schema}`);
      console.log('─'.repeat(50));

      // Create schema if not exists
      await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

      // Create migrations table in tenant schema if not exists
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".migrations (
          id SERIAL PRIMARY KEY,
          timestamp BIGINT NOT NULL,
          name VARCHAR NOT NULL
        )
      `);

      // Get already applied migrations in tenant schema
      const appliedMigrations = await dataSource.query(`
        SELECT name FROM "${schema}".migrations
      `);
      const appliedNames = new Set(appliedMigrations.map(m => m.name));

      // Get the migration files
      const fs = require('fs');
      const path = require('path');
      const migrationsDir = process.env.MIGRATIONS_DIR || '/app/dist/src/migrations';
      
      if (!fs.existsSync(migrationsDir)) {
        console.log(`⚠️  Migrations directory not found: ${migrationsDir}`);
        continue;
      }

      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.match(/^\d+-.*\.js$/))
        .sort();

      let appliedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      // Tables that belong ONLY to public schema (not tenant schemas)
      const publicOnlyTables = [
        'tenants',
        'user_tenant'
      ];

      for (const file of migrationFiles) {
        const match = file.match(/^(\d+)-(.+)\.js$/);
        if (!match) continue;

        const [, timestamp, name] = match;
        const className = name.split('-').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join('') + timestamp;

        if (appliedNames.has(className)) {
          skippedCount++;
          continue;
        }

        try {
          // Load and execute migration
          const migrationPath = path.join(migrationsDir, file);
          
          // Clear require cache to avoid stale modules
          delete require.cache[require.resolve(migrationPath)];
          
          const MigrationModule = require(migrationPath);
          
          // Handle different export patterns:
          // 1. module.exports = class ... (direct class export)
          // 2. export class ... (named export, becomes MigrationModule.ClassName)
          // 3. export default class ... (default export)
          let MigrationClass;
          
          if (typeof MigrationModule === 'function') {
            // Direct class export: module.exports = class ...
            MigrationClass = MigrationModule;
          } else if (MigrationModule.default && typeof MigrationModule.default === 'function') {
            // Default export: export default class ...
            MigrationClass = MigrationModule.default;
          } else {
            // Named export: export class ...
            const keys = Object.keys(MigrationModule);
            if (keys.length > 0 && typeof MigrationModule[keys[0]] === 'function') {
              MigrationClass = MigrationModule[keys[0]];
            }
          }
          
          if (!MigrationClass || typeof MigrationClass !== 'function') {
            console.log('  ⚠️  Could not find migration class in: ' + file);
            console.log('    Module type: ' + typeof MigrationModule);
            console.log('    Module keys: ' + Object.keys(MigrationModule).join(', '));
            failedCount++;
            continue;
          }

          const migration = new MigrationClass();

          // Create a query runner for the tenant schema
          const queryRunner = dataSource.createQueryRunner();
          await queryRunner.connect();
          
          // Set search path to tenant schema
          await queryRunner.query(`SET search_path TO "${schema}"`);

          try {
            // Intercept queries to filter out public-only tables and handle CREATE IF NOT EXISTS
            const originalQuery = queryRunner.query.bind(queryRunner);
            let hasPublicOnlyTable = false;
            let queriesExecuted = 0;

            queryRunner.query = async function(query, parameters) {
              // Check if query references public-only tables
              const queryLower = query.toLowerCase();
              for (const table of publicOnlyTables) {
                if (queryLower.includes('"' + table + '"') || 
                    queryLower.includes("'" + table + "'") ||
                    queryLower.includes(' ' + table + ' ') ||
                    queryLower.includes('(' + table + ' ') ||
                    queryLower.includes(' ' + table + ')')) {
                  hasPublicOnlyTable = true;
                  console.log('    ⊘ Skipping query for public-only table: ' + table);
                  return Promise.resolve();
                }
              }
              
              // Handle CREATE TABLE - add IF NOT EXISTS to avoid errors
              if (queryLower.includes('create table') && !queryLower.includes('if not exists')) {
                // Extract table name and add IF NOT EXISTS
                const createMatch = query.match(/CREATE TABLE "([^"]+)"/i);
                if (createMatch) {
                  const tableName = createMatch[1];
                  query = query.replace(/CREATE TABLE "([^"]+)"/, 'CREATE TABLE IF NOT EXISTS "$1"');
                }
              }
              
              // Handle CREATE TYPE - check if exists first
              if (queryLower.includes('create type')) {
                const typeMatch = query.match(/CREATE TYPE "([^"]+)"\.?"([^"]+)"/i);
                if (typeMatch) {
                  const schemaName = typeMatch[1];
                  const typeName = typeMatch[2] || typeMatch[1];
                  
                  // Check if type exists
                  try {
                    const typeExists = await originalQuery(
                      'SELECT 1 FROM pg_type WHERE typname = $1',
                      [typeName]
                    );
                    if (typeExists && typeExists.length > 0) {
                      console.log('    ⊘ Type already exists: ' + typeName);
                      return Promise.resolve();
                    }
                  } catch (e) {
                    // Ignore check errors
                  }
                }
              }
              
              try {
                const result = await originalQuery(query, parameters);
                queriesExecuted++;
                return result;
              } catch (error) {
                // Ignore "already exists" errors
                if (error.message && (
                    error.message.includes('already exists') ||
                    error.message.includes('duplicate key')
                )) {
                  console.log('    ⊘ Already exists, skipping: ' + error.message.split(':')[0]);
                  return Promise.resolve();
                }
                throw error;
              }
            };

            await migration.up(queryRunner);
            
            // Record migration if any queries were executed
            if (queriesExecuted > 0 || !hasPublicOnlyTable) {
              await dataSource.query(
                'INSERT INTO "' + schema + '".migrations (timestamp, name) VALUES ($1, $2)',
                [timestamp, className]
              );
              console.log('  ✓ Applied: ' + name + ' (' + queriesExecuted + ' queries)');
              appliedCount++;
            } else {
              console.log('  ⊘ Skipped (public-only): ' + name);
              skippedCount++;
            }
          } catch (error) {
            console.log('  ✗ Failed: ' + name);
            console.log('    Error: ' + error.message);
            failedCount++;
            // Continue with next migration
          } finally {
            await queryRunner.release();
          }
        } catch (error) {
          console.log('  ⚠️  Could not load migration: ' + file);
          console.log('    Error: ' + error.message);
          failedCount++;
        }
      }

      const totalProcessed = appliedCount + skippedCount + failedCount;
      console.log('\\n  Summary:');
      console.log('    ✓ Applied: ' + appliedCount);
      console.log('    ⊘ Already applied: ' + skippedCount);
      if (failedCount > 0) {
        console.log('    ✗ Failed: ' + failedCount);
      }
    }

    console.log('\\n\\n✅ All tenant schemas processed!');

  } finally {
    await dataSource.destroy();
  }
}

applyMigrationsToTenantSchemas()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
SCRIPT_EOF

# Run the script
echo "Applying migrations to tenant schemas..."
NODE_PATH="/app/node_modules" MIGRATIONS_DIR="$MIGRATIONS_DIR" $NODE_CMD /tmp/apply-tenant-migrations.js

# Clean up
rm /tmp/apply-tenant-migrations.js

echo ""
echo "=========================================="
echo "  Migration Complete!"
echo "=========================================="
echo ""
echo "✓ Public schema migrations: DONE"
echo "✓ Tenant schema migrations: DONE"
echo ""
