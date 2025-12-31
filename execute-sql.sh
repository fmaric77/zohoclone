#!/bin/bash
# Execute SQL file to create database tables
docker exec -i trems-postgres psql -U trems -d trems < prisma/init.sql
echo "SQL executed. Checking tables..."
docker exec trems-postgres psql -U trems -d trems -c "\dt"
