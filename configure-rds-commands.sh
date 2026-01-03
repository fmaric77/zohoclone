#!/bin/bash

# Simple script with AWS CLI commands to configure RDS
# Run these after installing AWS CLI: sudo apt install -y awscli
# Configure AWS: aws configure

set -e

DB_INSTANCE_ID="database-1"
REGION="eu-north-1"
SECURITY_GROUP_ID="sg-0007a0ff5d91edb39"

echo "🔧 Configuring RDS Database"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install it first:"
    echo "   sudo apt update && sudo apt install -y awscli"
    echo "   aws configure"
    exit 1
fi

# Check credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
fi

echo "✅ AWS CLI ready"
echo ""

# Step 1: Make database publicly accessible
echo "Step 1: Making database publicly accessible..."
aws rds modify-db-instance \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --publicly-accessible \
    --apply-immediately \
    --region "$REGION"

echo "✅ Modification initiated. Waiting for completion..."
aws rds wait db-instance-available \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$REGION"

echo "✅ Database is now publicly accessible!"
echo ""

# Step 2: Add security group rule
echo "Step 2: Adding PostgreSQL rule to security group..."

MY_IP=$(curl -s https://checkip.amazonaws.com 2>/dev/null || echo "0.0.0.0")
echo "Your IP: $MY_IP"
echo ""

# Add rule for your IP
echo "Adding rule for your IP..."
aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 5432 \
    --cidr "$MY_IP/32" \
    --region "$REGION" 2>&1 | grep -v "already exists" || echo "Rule already exists (that's okay)"

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📝 Test connection:"
echo "   npm run db:migrate"

