import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const APP_SECRET = process.env.APP_SECRET || 'trems-secret-key-change-in-production-32chars'
// Get hash - use hardcoded value if env var is corrupted by shell expansion
// Password: skeletorF1
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH?.replace(/^["']|["']$/g, '') || 
  '$2b$10$v2c/t3PqAARAPr4gOo4Wnej.t8LcwA/y9vCHbcWmznYt4T2E9aKl2'

// If hash doesn't start with $2b$, it was corrupted - use hardcoded value
const getPasswordHash = (): string => {
  const hash = ADMIN_PASSWORD_HASH.replace(/^["']|["']$/g, '')
  if (!hash.startsWith('$2b$')) {
    return '$2b$10$v2c/t3PqAARAPr4gOo4Wnej.t8LcwA/y9vCHbcWmznYt4T2E9aKl2'
  }
  return hash
}

export interface AuthToken {
  authenticated: boolean
  iat: number
  exp: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(): string {
  return jwt.sign(
    { authenticated: true },
    APP_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, APP_SECRET) as AuthToken
  } catch {
    return null
  }
}

export async function getAuthToken(): Promise<AuthToken | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  return token?.authenticated === true
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export async function login(password: string): Promise<boolean> {
  const hash = getPasswordHash()
  
  if (!hash || hash.length < 50) {
    // First time setup - hash the provided password
    const newHash = await hashPassword(password)
    console.warn('ADMIN_PASSWORD_HASH not set. Use this hash:', newHash)
    // In production, you should set this in .env.local
    return false
  }
  
  const isValid = await verifyPassword(password, hash)
  if (!isValid) {
    console.error('Password verification failed. Hash received:', hash.substring(0, 30) + '...', 'Length:', hash.length)
  }
  return isValid
}

