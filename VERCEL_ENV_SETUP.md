# Vercel Environment Variables Setup

## Required Environment Variables

You need to set these environment variables in Vercel for AWS SES to work:

### AWS Credentials

1. **AWS_ACCESS_KEY_ID**
   - Your AWS Access Key ID
   - Get it from: https://console.aws.amazon.com/iam/home#/users

2. **AWS_SECRET_ACCESS_KEY**
   - Your AWS Secret Access Key
   - ⚠️ Keep this secret! Never commit it to git.

3. **AWS_REGION**
   - AWS region where your SES is configured
   - **Set to**: `eu-north-1` (Stockholm) - based on your SNS configuration

### SES Configuration

4. **SES_FROM_EMAIL**
   - The verified email address in SES
   - Example: `info@trems.hr` or your verified email

5. **SES_CONFIGURATION_SET** (Optional)
   - Configuration set name for notifications
   - Default: `my-first-configuration-set`
   - Already configured, so you can skip this

## How to Set in Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to your project: https://vercel.com/dashboard
2. Select your project: `zohoclone`
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

   ```
   AWS_ACCESS_KEY_ID = your-access-key-id
   AWS_SECRET_ACCESS_KEY = your-secret-access-key
   AWS_REGION = eu-north-1
   SES_FROM_EMAIL = info@trems.hr
   ```

5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Set environment variables
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add SES_FROM_EMAIL

# Pull environment variables to verify
vercel env pull
```

## Getting Your AWS Credentials

### If you don't have credentials:

1. Go to AWS Console: https://console.aws.amazon.com/iam/
2. Navigate to **Users** → Select your user (or create one)
3. Go to **Security credentials** tab
4. Click **Create access key**
5. Choose **Application running outside AWS**
6. Copy the **Access key ID** and **Secret access key**

### Important: IAM Permissions

Your AWS user needs these permissions:
- `ses:SendEmail`
- `ses:SendRawEmail`
- `ses:GetAccountSendingEnabled`
- `ses:GetSendQuota`
- `ses:GetSendStatistics`

You can attach the `AmazonSESFullAccess` policy, or create a custom policy with just the permissions above.

## Verify Setup

After setting environment variables:

1. **Redeploy** your Vercel project (or wait for next deployment)
2. **Send a test email** from your application
3. **Check Vercel logs** for any errors

## Quick Setup Script

Run this to get your current AWS credentials (for reference):

```bash
echo "AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)"
echo "AWS_REGION=$(aws configure get region)"
echo ""
echo "⚠️  Don't share your secret access key!"
echo "   Get it from: aws configure get aws_secret_access_key"
```

## Troubleshooting

### "Could not load credentials"
- ✅ Check environment variables are set in Vercel
- ✅ Verify variable names are correct (case-sensitive)
- ✅ Redeploy after adding variables
- ✅ Check Vercel logs for detailed error messages

### "Access Denied" errors
- ✅ Verify IAM user has SES permissions
- ✅ Check SES is in correct region (`eu-north-1`)
- ✅ Verify email address is verified in SES

### Emails not sending
- ✅ Check SES sending quota (you're in sandbox mode initially)
- ✅ Verify sender email is verified in SES
- ✅ Check recipient email is verified (if in sandbox)

