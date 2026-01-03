#!/bin/bash

# Configure SES to send notifications to SNS topics
# This script sets up SES account-level notification preferences

REGION="eu-north-1"
BOUNCE_ARN="arn:aws:sns:eu-north-1:155684258496:ses-bounces"
COMPLAINT_ARN="arn:aws:sns:eu-north-1:155684258496:ses-complaints"
DELIVERY_ARN="arn:aws:sns:eu-north-1:155684258496:ses-deliveries"

echo "🔧 Configuring SES Notifications"
echo "================================"
echo ""
echo "Region: $REGION"
echo "Bounce Topic: $BOUNCE_ARN"
echo "Complaint Topic: $COMPLAINT_ARN"
echo "Delivery Topic: $DELIVERY_ARN"
echo ""

# Note: SES v2 API doesn't have a direct account-level notification setting
# We need to use the SES Console or create a configuration set

echo "⚠️  SES notification configuration requires Console access"
echo ""
echo "Please configure via AWS Console:"
echo ""
echo "1. Go to: https://console.aws.amazon.com/ses/"
echo "2. Select region: $REGION"
echo "3. Go to Configuration → Notifications"
echo ""
echo "For each notification type, configure:"
echo ""
echo "📧 Bounce Notifications:"
echo "   - Select: Amazon SNS topic"
echo "   - Topic ARN: $BOUNCE_ARN"
echo ""
echo "📧 Complaint Notifications:"
echo "   - Select: Amazon SNS topic"
echo "   - Topic ARN: $COMPLAINT_ARN"
echo ""
echo "📧 Delivery Notifications:"
echo "   - Select: Amazon SNS topic"
echo "   - Topic ARN: $DELIVERY_ARN"
echo ""
echo "✅ SNS topics are already created and subscribed to your webhook"
echo "   Webhook URL: https://zohoclone-three.vercel.app/api/webhooks/ses"
echo ""
echo "📋 Next: Configure SES notifications in Console using the ARNs above"

