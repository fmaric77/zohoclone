# Quick Setup Guide

## Password Setup

The application uses a single-user password authentication system. You need to set up your admin password.

### Option 1: Use Default Password (Quick Start)

I've generated a default password hash for you. The password is: **`admin123`**

### Option 2: Generate Your Own Password

Run this command to generate a password hash:
```bash
npm run setup:password
```

Or manually:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(hash => console.log(hash))"
```

## Database Setup

### Option 1: Using Docker (Recommended)

1. Install Docker if not already installed
2. Start PostgreSQL:
   ```bash
   docker-compose up -d
   ```
3. Run migrations:
   ```bash
   npm run db:migrate
   ```

### Option 2: Using Local PostgreSQL

If you have PostgreSQL installed locally:

1. Create a database:
   ```bash
   createdb trems
   ```
   Or using psql:
   ```sql
   CREATE DATABASE trems;
   CREATE USER trems WITH PASSWORD 'trems_password';
   GRANT ALL PRIVILEGES ON DATABASE trems TO trems;
   ```

2. Update `.env.local` with your connection string:
   ```
   DATABASE_URL="postgresql://trems:trems_password@localhost:5432/trems"
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
# Database
DATABASE_URL="postgresql://trems:trems_password@localhost:5432/trems"

# Admin Password (use the hash from above)
ADMIN_PASSWORD_HASH="$2b$10$0Upp1RENX/qBiz64tweGZO4Mo/wF3xefkQ.XKXnI.bqjubvGDWszy"

# App Secret (generate a random 32+ character string)
APP_SECRET="your-random-secret-key-here-change-in-production"

# AWS SES (required for sending emails)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
SES_FROM_EMAIL="campaigns@yourdomain.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## First Login

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/login

3. Use the password: **`admin123`** (or whatever password you set)

## Troubleshooting

### Database Connection Issues

- Make sure PostgreSQL is running
- Check that DATABASE_URL is correct
- Verify database exists: `psql -U trems -d trems`

### Password Issues

- Make sure ADMIN_PASSWORD_HASH is set in .env.local
- The hash must start with `$2b$10$`
- Regenerate if needed: `npm run setup:password`

