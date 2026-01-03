#!/bin/bash

echo "🔐 AWS Login Setup"
echo ""
echo "You'll need your AWS Access Key ID and Secret Access Key"
echo ""
echo "Get them from: https://console.aws.amazon.com/iam → Users → Your User → Security credentials"
echo ""
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
echo ""
echo "Configuring AWS CLI..."

aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set default.region eu-north-1
aws configure set default.output json

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Testing connection..."
aws sts get-caller-identity

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully logged in!"
else
    echo ""
    echo "❌ Login failed. Check your credentials."
fi

