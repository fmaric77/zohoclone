#!/bin/bash

# AWS SNS Webhook Configuration Script
# This script helps configure SNS topics to send notifications to your Vercel deployment

WEBHOOK_URL="https://zohoclone-three.vercel.app/api/webhooks/ses"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔧 AWS SNS Webhook Configuration"
echo "=================================="
echo ""
echo "Webhook URL: $WEBHOOK_URL"
echo "AWS Region: $AWS_REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Function to create SNS topic and subscription
create_sns_topic() {
    local topic_name=$1
    local topic_display_name=$2
    
    echo "Creating SNS topic: $topic_name"
    
    # Create topic
    TOPIC_ARN=$(aws sns create-topic \
        --name "$topic_name" \
        --region "$AWS_REGION" \
        --query 'TopicArn' \
        --output text 2>&1)
    
    if [ $? -ne 0 ]; then
        # Topic might already exist, try to get it
        TOPIC_ARN=$(aws sns list-topics \
            --region "$AWS_REGION" \
            --query "Topics[?contains(TopicArn, '$topic_name')].TopicArn" \
            --output text 2>&1)
        
        if [ -z "$TOPIC_ARN" ]; then
            echo "❌ Failed to create or find topic: $topic_name"
            return 1
        fi
    fi
    
    echo "✅ Topic ARN: $TOPIC_ARN"
    
    # Subscribe webhook URL to topic
    echo "Subscribing webhook URL to topic..."
    SUBSCRIPTION_ARN=$(aws sns subscribe \
        --topic-arn "$TOPIC_ARN" \
        --protocol https \
        --notification-endpoint "$WEBHOOK_URL" \
        --region "$AWS_REGION" \
        --query 'SubscriptionArn' \
        --output text 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✅ Subscription created: $SUBSCRIPTION_ARN"
        echo ""
        echo "⚠️  IMPORTANT: Check your webhook endpoint to confirm the subscription!"
        echo "   Visit: $WEBHOOK_URL"
        echo "   AWS will send a subscription confirmation request."
        echo ""
        return 0
    else
        echo "❌ Failed to create subscription"
        return 1
    fi
}

# Create topics for bounce, complaint, and delivery
echo "Creating SNS topics and subscriptions..."
echo ""

create_sns_topic "ses-bounces" "SES Bounce Notifications"
BOUNCE_TOPIC_ARN=$(aws sns list-topics --region "$AWS_REGION" --query "Topics[?contains(TopicArn, 'ses-bounces')].TopicArn" --output text)

create_sns_topic "ses-complaints" "SES Complaint Notifications"
COMPLAINT_TOPIC_ARN=$(aws sns list-topics --region "$AWS_REGION" --query "Topics[?contains(TopicArn, 'ses-complaints')].TopicArn" --output text)

create_sns_topic "ses-deliveries" "SES Delivery Notifications"
DELIVERY_TOPIC_ARN=$(aws sns list-topics --region "$AWS_REGION" --query "Topics[?contains(TopicArn, 'ses-deliveries')].TopicArn" --output text)

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Configure SES to send notifications to these topics:"
echo ""
echo "   Bounce Topic ARN:    $BOUNCE_TOPIC_ARN"
echo "   Complaint Topic ARN: $COMPLAINT_TOPIC_ARN"
echo "   Delivery Topic ARN: $DELIVERY_TOPIC_ARN"
echo ""
echo "2. In AWS SES Console:"
echo "   - Go to Configuration → Notifications"
echo "   - For each notification type (Bounce, Complaint, Delivery):"
echo "     * Select 'Amazon SNS topic'"
echo "     * Choose the corresponding topic above"
echo ""
echo "3. Verify subscription:"
echo "   - AWS will send a subscription confirmation to your webhook"
echo "   - Your webhook endpoint should handle SubscriptionConfirmation messages"
echo "   - Check Vercel logs to see if confirmation was received"
echo ""
echo "4. Test the setup:"
echo "   - Send a test email that bounces"
echo "   - Check your database to see if bounce events are logged"
echo ""
echo "✅ Configuration script completed!"
echo ""
echo "💡 Tip: You can also configure this via AWS Console:"
echo "   https://console.aws.amazon.com/ses/"

