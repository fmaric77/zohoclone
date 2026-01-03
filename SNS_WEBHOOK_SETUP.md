# AWS SNS Webhook Setup Guide

This guide will help you configure AWS SNS to send bounce, complaint, and delivery notifications to your Vercel deployment.

## Webhook URL

Your webhook endpoint is:
```
https://zohoclone-three.vercel.app/api/webhooks/ses
```

## Quick Setup (Automated)

Run the configuration script:

```bash
bash configure-sns-webhook.sh
```

This script will:
1. Create SNS topics for bounces, complaints, and deliveries
2. Subscribe your webhook URL to each topic
3. Provide you with the topic ARNs for SES configuration

## Manual Setup

### Step 1: Create SNS Topics

1. Go to [AWS SNS Console](https://console.aws.amazon.com/sns/)
2. Click "Create topic"
3. Create three topics:
   - **Name**: `ses-bounces`
   - **Name**: `ses-complaints`
   - **Name**: `ses-deliveries`

### Step 2: Subscribe Webhook to Topics

For each topic:

1. Click on the topic
2. Click "Create subscription"
3. Configure:
   - **Protocol**: HTTPS
   - **Endpoint**: `https://zohoclone-three.vercel.app/api/webhooks/ses`
4. Click "Create subscription"

### Step 3: Configure SES Notifications

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to **Configuration** → **Notifications**
3. For each notification type (Bounce, Complaint, Delivery):
   - Click "Edit"
   - Select **Amazon SNS topic**
   - Choose the corresponding SNS topic:
     - Bounces → `ses-bounces`
     - Complaints → `ses-complaints`
     - Deliveries → `ses-deliveries`
   - Click "Save changes"

### Step 4: Verify Subscription

1. AWS will send a subscription confirmation request to your webhook
2. Your webhook endpoint (`/api/webhooks/ses`) handles `SubscriptionConfirmation` messages
3. Check your Vercel logs to confirm the subscription was received
4. In AWS SNS Console, verify the subscription status shows "Confirmed"

## Testing

### Test Bounce Handling

1. Send an email to an invalid address (e.g., `invalid@example.com`)
2. Check your database - the contact should be marked as `BOUNCED`
3. Check the `EmailEvent` table for a `BOUNCED` event

### Test Complaint Handling

1. Send an email and mark it as spam (in test environment)
2. Check your database - the contact should be marked as `UNSUBSCRIBED`
3. Check the `EmailEvent` table for a `COMPLAINED` event

### Test Delivery Handling

1. Send an email to a valid address
2. Check the `EmailEvent` table for a `DELIVERED` event
3. The `EmailSend` status should update to `DELIVERED`

## Webhook Endpoint Details

Your webhook endpoint at `/api/webhooks/ses` handles:

- **SubscriptionConfirmation**: Confirms SNS subscription (required for HTTPS endpoints)
- **Notification**: Processes SES notifications:
  - **Bounce**: Marks contacts as BOUNCED for hard bounces
  - **Complaint**: Marks contacts as UNSUBSCRIBED
  - **Delivery**: Updates email send status to DELIVERED

## Troubleshooting

### Subscription Not Confirmed

- Check Vercel logs for subscription confirmation requests
- Ensure your webhook endpoint returns a 200 status code
- Verify the webhook URL is publicly accessible (no authentication required)

### Notifications Not Received

- Verify SNS topics are subscribed to your webhook URL
- Check SES notification configuration points to correct topics
- Review Vercel function logs for errors
- Ensure your database connection is working

### Events Not Logged

- Check database connection in Vercel environment variables
- Verify `DATABASE_URL` is set correctly
- Check that `messageId` from SES matches `messageId` stored in `EmailSend` table

## AWS CLI Commands

If you prefer using AWS CLI:

```bash
# Create topics
aws sns create-topic --name ses-bounces --region us-east-1
aws sns create-topic --name ses-complaints --region us-east-1
aws sns create-topic --name ses-deliveries --region us-east-1

# Subscribe webhook to topics
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:ses-bounces \
  --protocol https \
  --notification-endpoint https://zohoclone-three.vercel.app/api/webhooks/ses

# Configure SES (requires SES CLI or Console)
# Use AWS Console for SES notification configuration
```

## Security Notes

- Your webhook endpoint should verify SNS message signatures in production
- Consider adding authentication/authorization to your webhook endpoint
- Monitor webhook logs for suspicious activity
- Use HTTPS only (already configured)

## References

- [AWS SES Bounce and Complaint Handling](https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity.html)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [SNS Subscription Confirmation](https://docs.aws.amazon.com/sns/latest/dg/sns-http-https-endpoint-as-subscriber.html)

