#!/bin/bash
# Production Migration Revert Script
# This script reverts the last applied migration in production

set -e

echo "====================================="
echo "  Revert Production Migration"
echo "====================================="
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
    # Running in production Docker container with compiled code
    DATA_SOURCE_PATH="/app/dist/src/config/data-source.js"
    TYPEORM_CLI="node /app/node_modules/typeorm/cli.js"
    echo "✓ Using compiled production code"
elif [ "$NODE_ENV" = "production" ] && [ -f "dist/src/config/data-source.js" ]; then
    # Running from project root with compiled code
    DATA_SOURCE_PATH="dist/src/config/data-source.js"
    TYPEORM_CLI="node node_modules/typeorm/cli.js"
    echo "✓ Using local compiled code"
else
    # Running in development environment
    DATA_SOURCE_PATH="src/config/data-source.ts"
    TYPEORM_CLI="npx ts-node ./node_modules/typeorm/cli.js"
    echo "✓ Using TypeScript source code"
fi

echo "Data Source: $DATA_SOURCE_PATH"
echo ""

# Show current migration status
echo "Current migration status:"
$TYPEORM_CLI migration:show -d $DATA_SOURCE_PATH

echo ""
echo "⚠️  WARNING: This will revert the LAST applied migration!"
echo ""

# Prompt for confirmation
read -p "Are you sure you want to revert the last migration? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Revert cancelled"
    exit 0
fi

echo ""
echo "Reverting last migration..."
$TYPEORM_CLI migration:revert -d $DATA_SOURCE_PATH

echo ""
echo "✓ Migration reverted successfully!"
echo ""
echo "Updated migration status:"
$TYPEORM_CLI migration:show -d $DATA_SOURCE_PATH
