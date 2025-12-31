# 🚀 Run These Commands to Complete Setup

## Step 1: Set Up Database (Choose ONE)

### Option A: Docker (Easiest)
```bash
# Add yourself to docker group (one-time)
sudo usermod -aG docker $USER

# Log out and log back in, then run:
bash scripts/setup-docker-db.sh
```

### Option B: Install PostgreSQL
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres bash scripts/setup-database.sh
```

## Step 2: Create .env.local File

Create `.env.local` in the project root with:

```env
DATABASE_URL="postgresql://trems:trems_password@localhost:5432/trems"
ADMIN_PASSWORD_HASH="$2b$10$0Upp1RENX/qBiz64tweGZO4Mo/wF3xefkQ.XKXnI.bqjubvGDWszy"
APP_SECRET="trems-secret-key-change-in-production-32chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 3: Run Database Migrations

```bash
npm run db:migrate
```

## Step 4: Start the App

```bash
npm run dev
```

## Step 5: Login

- Go to: http://localhost:3000/login
- Password: `admin123`

---

**That's it!** The database integration is complete, you just need to run these setup commands.

