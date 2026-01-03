# AWS CLI Installation and Login Guide

## Step 1: Install AWS CLI

Run this command (you'll need to enter your password):

```bash
sudo apt update && sudo apt install -y awscli
```

## Step 2: Configure AWS Credentials

You have several options to authenticate:

### Option A: AWS Access Keys (Traditional)

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: `eu-north-1`
- **Default output format**: `json`

### Option B: AWS SSO (Single Sign-On) - Recommended

If your organization uses AWS SSO:

```bash
aws configure sso
```

Follow the prompts to set up SSO.

Then login:
```bash
aws sso login
```

### Option C: AWS SSO with Profile

```bash
aws configure sso --profile your-profile-name
aws sso login --profile your-profile-name
```

## Step 3: Verify Login

Test your authentication:

```bash
aws sts get-caller-identity
```

This should return your AWS account details.

## Step 4: Configure RDS

Once authenticated, run:

```bash
./configure-rds-commands.sh
```

Or manually:

```bash
# Make database publicly accessible
aws rds modify-db-instance \
    --db-instance-identifier database-1 \
    --publicly-accessible \
    --apply-immediately \
    --region eu-north-1

# Wait for completion
aws rds wait db-instance-available \
    --db-instance-identifier database-1 \
    --region eu-north-1

# Add security group rule
MY_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress \
    --group-id sg-0007a0ff5d91edb39 \
    --protocol tcp \
    --port 5432 \
    --cidr $MY_IP/32 \
    --region eu-north-1
```

## Getting AWS Credentials

If you need to create access keys:
1. Go to AWS Console → IAM → Users → Your User
2. Security credentials tab
3. Create access key
4. Download and save securely

