#!/bin/bash
# Revert Multi-Tenant Migration Script
# This script reverts the last migration from ALL schemas (public + tenants)

# Don't exit on error - we want to process all tenants even if one fails
set +e

echo "=========================================="
echo "  Revert Multi-Tenant Migration"
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

echo "⚠️  WARNING: This will revert the LAST migration from:"
echo "  - Public schema"
echo "  - ALL tenant schemas"
echo ""

# Prompt for confirmation
read -p "Are you sure you want to revert? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Revert cancelled"
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
echo "  STEP 1: Revert Public Schema"
echo "=========================================="
echo ""

echo "Reverting public schema migration..."
$TYPEORM_CLI migration:revert -d $DATA_SOURCE_PATH

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Public schema migration reverted!"
else
    echo ""
    echo "✗ Failed to revert public schema migration"
    echo "Continuing with tenant schemas..."
fi

echo ""
echo "=========================================="
echo "  STEP 2: Revert Tenant Schemas"
echo "=========================================="
echo ""

# Create a Node.js script to revert migrations from all tenant schemas
cat > /tmp/revert-tenant-migrations.js << 'SCRIPT_EOF'
const { DataSource } = require('typeorm');

async function revertMigrationsFromTenantSchemas() {
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
      console.log('⚠️  No active tenants found. Nothing to revert.');
      return;
    }

    const fs = require('fs');
    const path = require('path');
    const migrationsDir = process.env.MIGRATIONS_DIR || '/app/dist/src/migrations';

    let successCount = 0;
    let failedCount = 0;
    let noMigrationsCount = 0;

    // Revert from each tenant schema
    for (const schema of tenantSchemas) {
      console.log(`\n📦 Processing schema: ${schema}`);
      console.log('─'.repeat(50));

      try {
        // Get last applied migration in tenant schema
        const lastMigration = await dataSource.query(`
          SELECT * FROM "${schema}".migrations 
          ORDER BY id DESC 
          LIMIT 1
        `);

        if (lastMigration.length === 0) {
          console.log('  ⊘ No migrations to revert');
          noMigrationsCount++;
          continue;
        }

        const migration = lastMigration[0];
        const migrationName = migration.name;
        
        console.log(`  Reverting: ${migrationName}`);

        // Find the migration file
        const migrationFiles = fs.readdirSync(migrationsDir)
          .filter(f => f.match(/^\d+-.*\.js$/));

        let migrationFile = null;
        for (const file of migrationFiles) {
          const match = file.match(/^(\d+)-(.+)\.js$/);
          if (!match) continue;

          const [, timestamp, name] = match;
          const className = name.split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join('') + timestamp;

          if (className === migrationName) {
            migrationFile = file;
            break;
          }
        }

        if (!migrationFile) {
          console.log(`  ✗ Migration file not found for: ${migrationName}`);
          failedCount++;
          continue;
        }

        // Load and execute migration down
        const migrationPath = path.join(migrationsDir, migrationFile);
        
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
          console.log('  ✗ Could not find migration class in: ' + migrationFile);
          failedCount++;
          continue;
        }

        const migrationInstance = new MigrationClass();

        // Create a query runner for the tenant schema
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        
        // Set search path to tenant schema
        await queryRunner.query(`SET search_path TO "${schema}"`);

        try {
          // Execute down migration
          await migrationInstance.down(queryRunner);
          
          // Remove migration record
          await dataSource.query(
            'DELETE FROM "' + schema + '".migrations WHERE id = $1',
            [migration.id]
          );
          
          console.log('  ✓ Reverted successfully');
          successCount++;
        } catch (error) {
          console.log('  ✗ Failed to revert');
          console.log('    Error: ' + error.message);
          failedCount++;
        } finally {
          await queryRunner.release();
        }
      } catch (error) {
        console.log('  ✗ Error processing schema');
        console.log('    Error: ' + error.message);
        failedCount++;
      }
    }

    console.log('\n\n📊 Revert Summary:');
    console.log('  ✓ Successfully reverted: ' + successCount);
    console.log('  ⊘ No migrations to revert: ' + noMigrationsCount);
    if (failedCount > 0) {
      console.log('  ✗ Failed: ' + failedCount);
    }

  } finally {
    await dataSource.destroy();
  }
}

revertMigrationsFromTenantSchemas()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
SCRIPT_EOF

# Run the script
echo "Reverting migrations from tenant schemas..."
NODE_PATH="/app/node_modules" MIGRATIONS_DIR="$MIGRATIONS_DIR" $NODE_CMD /tmp/revert-tenant-migrations.js

# Clean up
rm /tmp/revert-tenant-migrations.js

echo ""
echo "=========================================="
echo "  Revert Complete!"
echo "=========================================="
echo ""
