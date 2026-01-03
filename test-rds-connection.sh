#!/bin/bash

# Test RDS Connection Script
# Run this after configuring security group and making database publicly accessible

echo "Testing RDS PostgreSQL connection..."
echo "Endpoint: database-1.cp408yo6kl2p.eu-north-1.rds.amazonaws.com:5432"
echo ""

# Test basic connectivity
echo "1. Testing network connectivity..."
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/database-1.cp408yo6kl2p.eu-north-1.rds.amazonaws.com/5432' 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Network connection successful!"
else
    echo "❌ Network connection failed - check security group"
    exit 1
fi

echo ""
echo "2. Testing database connection with Prisma..."
DATABASE_URL="postgresql://postgres:skeletorF1@database-1.cp408yo6kl2p.eu-north-1.rds.amazonaws.com:5432/postgres" npx prisma db execute --stdin <<< "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    echo ""
    echo "3. Running migrations..."
    DATABASE_URL="postgresql://postgres:skeletorF1@database-1.cp408yo6kl2p.eu-north-1.rds.amazonaws.com:5432/postgres" npm run db:migrate
else
    echo "❌ Database connection failed"
    echo "Make sure:"
    echo "  - Database is publicly accessible"
    echo "  - Security group allows port 5432 from your IP"
    echo "  - Username and password are correct"
fi

