#!/bin/bash
# Production Multi-Tenant Migration Script
# This script runs migrations on public schema AND all tenant schemas

set -e

echo "=========================================="
echo "  Multi-Tenant Production Migration"
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
echo "Node Environment: $NODE_ENV"
echo ""

# Determine the correct data-source path based on environment
# Check if we're in production or development
if [ "$NODE_ENV" = "production" ] && [ -f "/app/dist/src/config/data-source.js" ]; then
    DATA_SOURCE_PATH="/app/dist/src/config/data-source.js"
    TYPEORM_CLI="node /app/node_modules/typeorm/cli.js"
    echo "✓ Using compiled production code"
elif [ "$NODE_ENV" = "production" ] && [ -f "dist/src/config/data-source.js" ]; then
    DATA_SOURCE_PATH="dist/src/config/data-source.js"
    TYPEORM_CLI="node node_modules/typeorm/cli.js"
    echo "✓ Using local compiled code"
else
    DATA_SOURCE_PATH="src/config/data-source.ts"
    TYPEORM_CLI="npx ts-node ./node_modules/typeorm/cli.js"
    echo "✓ Using TypeScript source code"
fi

echo "Data Source: $DATA_SOURCE_PATH"
echo ""

# Prompt for confirmation
read -p "Are you sure you want to run migrations on production (public + all tenants)? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "=========================================="
echo "  STEP 1: Public Schema Migrations"
echo "=========================================="
echo ""

echo "Showing pending migrations..."
$TYPEORM_CLI migration:show -d $DATA_SOURCE_PATH

echo ""
read -p "Continue with public schema migration? (yes/no): " CONFIRM2
if [ "$CONFIRM2" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "Running public schema migrations..."
$TYPEORM_CLI migration:run -d $DATA_SOURCE_PATH

echo ""
echo "✓ Public schema migrations completed!"
echo ""

echo "=========================================="
echo "  STEP 2: Tenant Schema Migrations"
echo "=========================================="
echo ""

# Check if tenant migration script exists
if [ -f "dist/src/scripts/run-tenant-migrations.js" ]; then
    echo "Running tenant migrations..."
    node dist/src/scripts/run-tenant-migrations.js
elif [ -f "/app/dist/src/scripts/run-tenant-migrations.js" ]; then
    echo "Running tenant migrations..."
    node /app/dist/src/scripts/run-tenant-migrations.js
else
    echo "⚠️  WARNING: Tenant migration script not found in compiled code"
    echo "Attempting with ts-node..."
    if command -v ts-node &> /dev/null; then
        npm run tenant:migrate
    else
        echo "❌ Cannot run tenant migrations - ts-node not available"
        echo "   Please ensure tenant migrations are compiled and available"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "  Migration Complete!"
echo "=========================================="
echo ""
echo "✓ Public schema migrations: DONE"
echo "✓ Tenant schema migrations: DONE"
echo ""

# Show final status
echo "Final migration status:"
$TYPEORM_CLI migration:show -d $DATA_SOURCE_PATH
