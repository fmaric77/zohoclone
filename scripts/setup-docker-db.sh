#!/bin/bash

# Setup script for PostgreSQL using Docker
# This script will start PostgreSQL in a Docker container

set -e

echo "Setting up TREMS database with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if container already exists
if docker ps -a | grep -q trems-postgres; then
    echo "Container exists, starting it..."
    docker start trems-postgres
else
    echo "Creating new PostgreSQL container..."
    docker run -d \
        --name trems-postgres \
        -e POSTGRES_USER=trems \
        -e POSTGRES_PASSWORD=trems_password \
        -e POSTGRES_DB=trems \
        -p 5432:5432 \
        --restart unless-stopped \
        postgres:16-alpine
    
    echo "Waiting for PostgreSQL to start..."
    sleep 5
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec trems-postgres pg_isready -U trems > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "Database connection string:"
echo "postgresql://trems:trems_password@localhost:5432/trems"
echo ""
echo "Now run: npm run db:migrate"

