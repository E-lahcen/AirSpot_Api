#!/bin/bash
# Production Migration Script
# This script connects to the production database and runs pending migrations

set -e

echo "====================================="
echo "  Production Database Migration"
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
echo ""

# Prompt for confirmation in production
read -p "Are you sure you want to run migrations on production? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "Showing pending migrations..."
npm run migration:show

echo ""
read -p "Continue with migration? (yes/no): " CONFIRM2
if [ "$CONFIRM2" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "Running migrations..."
npm run migration:run

echo ""
echo "✓ Migrations completed successfully!"
echo ""
echo "Showing migration status..."
npm run migration:show
