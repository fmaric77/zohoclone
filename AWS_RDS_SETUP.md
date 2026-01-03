# AWS RDS PostgreSQL Setup Guide

## Connection Details
- **Username**: `postgres`
- **Password**: `skeletorF1`
- **Endpoint**: (Get from AWS RDS Console)
- **Port**: `5432` (default PostgreSQL port)
- **Database Name**: (Usually `postgres` or your custom database name)

## Steps to Connect

### 1. Get Your RDS Endpoint
1. Go to AWS Console → RDS → Databases
2. Click on your database instance
3. Under "Connectivity & security", copy the **Endpoint** (e.g., `your-db.xxxxx.us-east-1.rds.amazonaws.com`)

### 2. Update Environment Variable

Create or update `.env.local` file in the project root:

```bash
DATABASE_URL="postgresql://postgres:skeletorF1@YOUR_ENDPOINT:5432/postgres"
```

Replace `YOUR_ENDPOINT` with your actual RDS endpoint.

**Example:**
```bash
DATABASE_URL="postgresql://postgres:skeletorF1@mydb.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres"
```

### 3. Configure Security Group (Important!)

Make sure your RDS security group allows connections:
1. Go to RDS → Your Database → Connectivity & security → VPC security groups
2. Click on the security group
3. Go to "Inbound rules" → Edit inbound rules
4. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your IP address (or `0.0.0.0/0` for testing, but restrict later for security)

### 4. Run Database Migrations

```bash
npm run db:migrate
```

This will create all the necessary tables in your RDS database.

### 5. Verify Connection

You can test the connection by running:

```bash
npm run db:studio
```

This opens Prisma Studio where you can view your database.

## Troubleshooting

### Connection Timeout
- Check security group allows your IP
- Verify endpoint URL is correct
- Ensure database is publicly accessible (if connecting from outside AWS)

### Authentication Failed
- Double-check username and password
- Make sure password doesn't have special characters that need URL encoding

### Database Not Found
- Check database name in connection string
- Default database is usually `postgres`

## Security Best Practices

1. **Restrict Security Group**: Only allow your IP address or specific IP ranges
2. **Use SSL**: Add `?sslmode=require` to connection string for production
3. **Rotate Passwords**: Change password regularly
4. **Use IAM Authentication**: Consider using IAM database authentication for better security

## Connection String with SSL (Recommended for Production)

```bash
DATABASE_URL="postgresql://postgres:skeletorF1@YOUR_ENDPOINT:5432/postgres?sslmode=require"
```

