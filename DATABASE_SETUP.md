# Database Setup Guide

## Quick Setup (Choose One Method)

### Method 1: Docker (Recommended - No System Install)

```bash
# 1. Add user to docker group (one-time, requires logout/login)
sudo usermod -aG docker $USER

# 2. Log out and log back in, then run:
bash scripts/setup-docker-db.sh

# 3. Run migrations
npm run db:migrate

# 4. Verify connection
bash scripts/verify-db.sh
```

### Method 2: System PostgreSQL Install

```bash
# 1. Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 2. Setup database
sudo -u postgres bash scripts/setup-database.sh

# 3. Run migrations
npm run db:migrate

# 4. Verify connection
bash scripts/verify-db.sh
```

## Environment Variables

The `.env.local` file should contain:

```env
DATABASE_URL="postgresql://trems:trems_password@localhost:5432/trems"
ADMIN_PASSWORD_HASH="$2b$10$0Upp1RENX/qBiz64tweGZO4Mo/wF3xefkQ.XKXnI.bqjubvGDWszy"
APP_SECRET="trems-secret-key-change-in-production-32chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Note**: `.env.local` is gitignored. Create it manually if it doesn't exist.

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes:

- **Contact** - Email contacts with status tracking
- **Tag** - Tags for organizing contacts and campaigns  
- **Campaign** - Email campaigns with scheduling
- **EmailSend** - Individual email sends with tracking
- **EmailEvent** - Events (opens, clicks, bounces, etc.)

## Verification

After setup, verify everything works:

1. **Check database connection**:
   ```bash
   bash scripts/verify-db.sh
   ```

2. **Check Prisma connection**:
   ```bash
   npx prisma db pull
   ```

3. **View database in Prisma Studio**:
   ```bash
   npm run db:studio
   ```

4. **Start the app and login**:
   ```bash
   npm run dev
   # Go to http://localhost:3000/login
   # Password: admin123
   ```

## Troubleshooting

### "Connection refused" error
- Make sure PostgreSQL is running
- Check port 5432 is not blocked
- Verify DATABASE_URL in .env.local

### "Database does not exist" error
- Run the setup script again
- Manually create: `createdb trems`

### "Permission denied" error
- For Docker: Add user to docker group and logout/login
- For PostgreSQL: Check user permissions

### Migration errors
- Make sure database exists and is accessible
- Check DATABASE_URL is correct
- Try: `npx prisma migrate reset` (WARNING: deletes all data)

