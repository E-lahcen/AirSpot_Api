#!/bin/bash
# Simple Production Migration Runner
# This script runs migrations in production using compiled JavaScript
# Use this in your production environment (Fly.io, AWS, Docker, etc.)

set -e

echo "====================================="
echo "  Production Migration (Simple)"
echo "====================================="
echo ""

# Check if we're in a production environment with compiled code
if [ ! -f "dist/src/config/data-source.js" ] && [ ! -f "/app/dist/src/config/data-source.js" ]; then
    echo "ERROR: Compiled code not found!"
    echo "This script requires compiled JavaScript files."
    echo "Please ensure you've run 'npm run build' or are in a production container."
    exit 1
fi

# Set the correct paths
if [ -f "/app/dist/src/config/data-source.js" ]; then
    DATA_SOURCE="/app/dist/src/config/data-source.js"
    TYPEORM="/app/node_modules/typeorm/cli.js"
else
    DATA_SOURCE="dist/src/config/data-source.js"
    TYPEORM="node_modules/typeorm/cli.js"
fi

echo "Using data source: $DATA_SOURCE"
echo ""

# Run migrations
echo "Running migrations..."
node $TYPEORM migration:run -d $DATA_SOURCE

echo ""
echo "✓ Done!"
