# Quick Start Guide

## Password

**Default password: `admin123`**

The password hash is already generated. You just need to add it to your `.env.local` file.

## Database Setup

You have two options:

### Option 1: Install docker-compose (Recommended)

```bash
sudo apt install docker-compose
docker-compose up -d
```

### Option 2: Use Docker directly

```bash
docker run -d \
  --name trems-postgres \
  -e POSTGRES_USER=trems \
  -e POSTGRES_PASSWORD=trems_password \
  -e POSTGRES_DB=trems \
  -p 5432:5432 \
  postgres:16-alpine
```

### Option 3: Use existing PostgreSQL

If you have PostgreSQL installed, create the database:
```bash
createdb trems
# or using psql:
psql -c "CREATE DATABASE trems;"
```

## Setup Steps

1. **Create `.env.local` file** with this content:

```env
DATABASE_URL="postgresql://trems:trems_password@localhost:5432/trems"
ADMIN_PASSWORD_HASH="$2b$10$0Upp1RENX/qBiz64tweGZO4Mo/wF3xefkQ.XKXnI.bqjubvGDWszy"
APP_SECRET="change-this-to-random-32-chars-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

2. **Start the database** (if using Docker):
   ```bash
   docker-compose up -d
   # OR
   docker run -d --name trems-postgres -e POSTGRES_USER=trems -e POSTGRES_PASSWORD=trems_password -e POSTGRES_DB=trems -p 5432:5432 postgres:16-alpine
   ```

3. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Start the app**:
   ```bash
   npm run dev
   ```

5. **Login** at http://localhost:3000/login with password: **`admin123`**

## Summary

- **Password**: `admin123`
- **Database**: PostgreSQL on localhost:5432
- **Database name**: `trems`
- **Database user**: `trems`
- **Database password**: `trems_password`

