import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Check if SSL is required (AWS RDS typically requires SSL)
const isAWSRDS = connectionString.includes('rds.amazonaws.com')
const hasSSLMode = connectionString.includes('sslmode=')

// Remove sslmode from connection string to handle SSL via Pool config instead
let cleanConnectionString = connectionString
if (hasSSLMode) {
  cleanConnectionString = connectionString.replace(/[?&]sslmode=[^&]*/, '').replace(/\?$/, '')
}

const pool = new Pool({ 
  connectionString: cleanConnectionString,
  // Explicitly handle SSL for AWS RDS - accept self-signed certificates
  ssl: isAWSRDS ? { 
    rejectUnauthorized: false, // AWS RDS uses certificates that may not be in the system CA store
  } : undefined
})
const adapter = new PrismaPg(pool)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
