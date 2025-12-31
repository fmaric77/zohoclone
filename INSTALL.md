# Installation Instructions

## Step 1: Install PostgreSQL

Choose ONE of these options:

### Option A: Install PostgreSQL directly (Recommended for production)
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres bash scripts/setup-database.sh
```

### Option B: Use Docker (Easier, no system install)
```bash
# Add your user to docker group (one-time setup)
sudo usermod -aG docker $USER
# Log out and back in, then run:
bash scripts/setup-docker-db.sh
```

## Step 2: Run Database Migrations

After the database is set up, run:
```bash
npm run db:migrate
```

## Step 3: Start the Application

```bash
npm run dev
```

## Step 4: Login

Go to http://localhost:3000/login
- Password: `admin123`

## Troubleshooting

### Docker Permission Issues
If you get "permission denied" with Docker:
```bash
sudo usermod -aG docker $USER
# Then log out and log back in
```

### Database Connection Issues
Make sure PostgreSQL is running:
- Docker: `docker ps | grep trems-postgres`
- System: `sudo systemctl status postgresql`

### Migration Issues
If migrations fail, make sure:
1. Database exists: `psql -U trems -d trems -c "SELECT 1;"`
2. DATABASE_URL in .env.local is correct
3. Database is accessible from localhost
