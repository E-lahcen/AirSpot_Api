#!/bin/bash
# Production Migration Generator
# This script generates a new migration based on entity changes

set -e

echo "====================================="
echo "  Generate Production Migration"
echo "====================================="
echo ""

# Check if migration name is provided
if [ -z "$1" ]; then
    echo "ERROR: Migration name is required"
    echo "Usage: $0 <migration-name>"
    echo "Example: $0 add-user-phone-number"
    exit 1
fi

MIGRATION_NAME=$1

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
echo "Migration Name: $MIGRATION_NAME"
echo ""

# Determine the correct data-source path based on environment
# Check if we're in production or development
if [ "$NODE_ENV" = "production" ] && [ -f "/app/dist/src/config/data-source.js" ]; then
    # Running in production Docker container with compiled code
    DATA_SOURCE_PATH="/app/dist/src/config/data-source.js"
    TYPEORM_CLI="node /app/node_modules/typeorm/cli.js"
    MIGRATION_DIR="/app/dist/src/migrations"
    echo "✓ Using compiled production code"
elif [ "$NODE_ENV" = "production" ] && [ -f "dist/src/config/data-source.js" ]; then
    # Running from project root with compiled code
    DATA_SOURCE_PATH="dist/src/config/data-source.js"
    TYPEORM_CLI="node node_modules/typeorm/cli.js"
    MIGRATION_DIR="dist/src/migrations"
    echo "✓ Using local compiled code"
else
    # Running in development environment
    DATA_SOURCE_PATH="src/config/data-source.ts"
    TYPEORM_CLI="npx ts-node ./node_modules/typeorm/cli.js"
    MIGRATION_DIR="src/migrations"
    echo "✓ Using TypeScript source code"
fi

echo "Data Source: $DATA_SOURCE_PATH"
echo "Migration Directory: $MIGRATION_DIR"
echo ""

# Generate timestamp
TIMESTAMP=$(date +%s)
MIGRATION_FILE="${TIMESTAMP}-${MIGRATION_NAME}"

echo "Generating migration: $MIGRATION_FILE"
echo ""

# Generate migration
$TYPEORM_CLI migration:generate -d $DATA_SOURCE_PATH $MIGRATION_DIR/$MIGRATION_FILE

echo ""
echo "✓ Migration generated successfully!"
echo ""
echo "Migration file created in: $MIGRATION_DIR/"
echo ""
echo "Next steps:"
echo "1. Review the generated migration file"
echo "2. Test it in debug environment: npm run migrate:debug"
echo "3. Run it in production: npm run migrate:prod"
