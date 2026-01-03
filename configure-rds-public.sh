#!/bin/bash

# Script to configure RDS database to be publicly accessible via AWS CLI
# Database: database-1
# Region: eu-north-1
# Security Group: sg-0007a0ff5d91edb39

set -e

echo "🔧 Configuring RDS Database to be Publicly Accessible"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found."
    echo ""
    echo "Please install AWS CLI first:"
    echo ""
    echo "Option 1 (Recommended - via package manager):"
    echo "  sudo apt update && sudo apt install -y awscli"
    echo ""
    echo "Option 2 (Manual install):"
    echo "  cd /tmp"
    echo "  wget https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip"
    echo "  unzip awscliv2.zip"
    echo "  sudo ./aws/install"
    echo ""
    echo "Then configure with: aws configure"
    echo ""
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: eu-north-1"
    exit 1
fi

echo "✅ AWS credentials configured"
echo ""

# Set variables
DB_INSTANCE_ID="database-1"
REGION="eu-north-1"
SECURITY_GROUP_ID="sg-0007a0ff5d91edb39"

echo "📋 Configuration:"
echo "  Database: $DB_INSTANCE_ID"
echo "  Region: $REGION"
echo "  Security Group: $SECURITY_GROUP_ID"
echo ""

# Step 1: Make database publicly accessible
echo "Step 1: Making database publicly accessible..."
aws rds modify-db-instance \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --publicly-accessible \
    --apply-immediately \
    --region "$REGION" \
    --output json

echo "✅ Database modification initiated"
echo "⏳ This will take 2-5 minutes. Waiting for completion..."
echo ""

# Wait for modification to complete
echo "Waiting for database to be available..."
aws rds wait db-instance-available \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$REGION"

echo "✅ Database is now publicly accessible!"
echo ""

# Step 2: Add PostgreSQL inbound rule to security group
echo "Step 2: Adding PostgreSQL inbound rule to security group..."

# Get your current public IP
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "Your IP: $MY_IP"
echo ""

# Check if rule already exists
EXISTING_RULE=$(aws ec2 describe-security-groups \
    --group-ids "$SECURITY_GROUP_ID" \
    --region "$REGION" \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\` && ToPort==\`5432\`]" \
    --output json)

if [ "$EXISTING_RULE" != "[]" ]; then
    echo "⚠️  PostgreSQL rule already exists in security group"
    echo "Current rules:"
    aws ec2 describe-security-groups \
        --group-ids "$SECURITY_GROUP_ID" \
        --region "$REGION" \
        --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\`]" \
        --output table
else
    echo "Adding PostgreSQL rule (port 5432) for your IP: $MY_IP/32"
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 5432 \
        --cidr "$MY_IP/32" \
        --region "$REGION" \
        --output json
    
    echo "✅ Security group rule added!"
    echo ""
    echo "💡 To allow from anywhere (less secure, needed for serverless):"
    echo "   aws ec2 authorize-security-group-ingress \\"
    echo "       --group-id $SECURITY_GROUP_ID \\"
    echo "       --protocol tcp \\"
    echo "       --port 5432 \\"
    echo "       --cidr 0.0.0.0/0 \\"
    echo "       --region $REGION"
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📝 Connection string:"
echo "   DATABASE_URL=\"postgresql://postgres:skeletorF1@database-1.cp408yo6kl2p.eu-north-1.rds.amazonaws.com:5432/postgres\""
echo ""
echo "🧪 Test connection:"
echo "   npm run db:migrate"

