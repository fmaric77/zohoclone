#!/bin/bash

# Verify database connection
echo "Testing database connection..."

# Try to connect using psql
if command -v psql &> /dev/null; then
    echo "Testing with psql..."
    PGPASSWORD=trems_password psql -h localhost -U trems -d trems -c "SELECT version();" && echo "✅ Connection successful!" || echo "❌ Connection failed"
else
    echo "psql not found, trying Docker..."
    docker exec trems-postgres psql -U trems -d trems -c "SELECT version();" && echo "✅ Connection successful!" || echo "❌ Connection failed - make sure container is running"
fi

