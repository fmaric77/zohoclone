#!/bin/bash

# Setup script for PostgreSQL database
# Run this script after PostgreSQL is installed

set -e

echo "Setting up TREMS database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Installing..."
    echo "Please run: sudo apt update && sudo apt install -y postgresql postgresql-contrib"
    exit 1
fi

# Check if running as postgres user or with sudo
if [ "$EUID" -ne 0 ] && [ "$USER" != "postgres" ]; then
    echo "This script needs to be run as postgres user or with sudo"
    echo "Run: sudo -u postgres bash $0"
    exit 1
fi

# Create database and user
echo "Creating database and user..."
psql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'trems') THEN
        CREATE USER trems WITH PASSWORD 'trems_password';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE trems OWNER trems'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'trems')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE trems TO trems;
\c trems
GRANT ALL ON SCHEMA public TO trems;
EOF

echo "✅ Database setup complete!"
echo ""
echo "Database connection string:"
echo "postgresql://trems:trems_password@localhost:5432/trems"
echo ""
echo "Now run: npm run db:migrate"

