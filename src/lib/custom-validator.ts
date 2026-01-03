import dns from 'dns/promises'

export type CustomValidationStatus = 'VALID' | 'INVALID' | 'CATCH_ALL' | 'UNKNOWN' | 'NOT_VALIDATED'

export interface CustomValidationResult {
  status: CustomValidationStatus
  score: number // 0-100
  metadata: {
    domain: string
    mxRecords: string[]
    mxFound: boolean
    domainExists: boolean
    syntaxValid: boolean
    disposable?: boolean
    freeEmail?: boolean
  }
  validatedAt: Date
}

// List of common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  // Add more as needed
])

// List of free email providers
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  // Add more as needed
])

/**
 * Validates email syntax
 */
function validateSyntax(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Extracts domain from email
 */
function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || ''
}

/**
 * Checks if domain has MX records
 */
async function checkMXRecords(domain: string): Promise<{ mxFound: boolean; mxRecords: string[] }> {
  try {
    const mxRecords = await dns.resolveMx(domain)
    return {
      mxFound: mxRecords.length > 0,
      mxRecords: mxRecords.map(record => record.exchange),
    }
  } catch (error) {
    return {
      mxFound: false,
      mxRecords: [],
    }
  }
}

/**
 * Checks if domain exists (has A or AAAA records)
 */
async function checkDomainExists(domain: string): Promise<boolean> {
  try {
    await dns.resolve4(domain)
    return true
  } catch {
    try {
      await dns.resolve6(domain)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Checks if email is from disposable domain
 */
function isDisposableEmail(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain)
}

/**
 * Checks if email is from free email provider
 */
function isFreeEmail(domain: string): boolean {
  return FREE_EMAIL_DOMAINS.has(domain)
}

/**
 * Custom email validator - Basic version (DNS/MX only)
 * 
 * This is a BASIC validator that only checks:
 * - Syntax
 * - Domain existence
 * - MX records
 * 
 * It does NOT do SMTP verification (which requires connecting to mail servers)
 * For production use, you'd want SMTP verification + spam trap databases
 */
export async function validateEmailCustom(
  email: string
): Promise<CustomValidationResult> {
  const domain = extractDomain(email)
  
  // Step 1: Syntax validation
  const syntaxValid = validateSyntax(email)
  if (!syntaxValid) {
    return {
      status: 'INVALID',
      score: 0,
      metadata: {
        domain,
        mxRecords: [],
        mxFound: false,
        domainExists: false,
        syntaxValid: false,
      },
      validatedAt: new Date(),
    }
  }

  // Step 2: Check if disposable
  const disposable = isDisposableEmail(domain)
  if (disposable) {
    return {
      status: 'INVALID',
      score: 0,
      metadata: {
        domain,
        mxRecords: [],
        mxFound: false,
        domainExists: false,
        syntaxValid: true,
        disposable: true,
      },
      validatedAt: new Date(),
    }
  }

  // Step 3: Check domain existence
  const domainExists = await checkDomainExists(domain)
  if (!domainExists) {
    return {
      status: 'INVALID',
      score: 0,
      metadata: {
        domain,
        mxRecords: [],
        mxFound: false,
        domainExists: false,
        syntaxValid: true,
        disposable: false,
      },
      validatedAt: new Date(),
    }
  }

  // Step 4: Check MX records
  const { mxFound, mxRecords } = await checkMXRecords(domain)
  if (!mxFound) {
    return {
      status: 'INVALID',
      score: 0,
      metadata: {
        domain,
        mxRecords: [],
        mxFound: false,
        domainExists: true,
        syntaxValid: true,
        disposable: false,
        freeEmail: isFreeEmail(domain),
      },
      validatedAt: new Date(),
    }
  }

  // Step 5: Calculate score
  // Without SMTP verification, we can't be 100% sure
  // So we mark as UNKNOWN with moderate score
  const freeEmail = isFreeEmail(domain)
  const score = freeEmail ? 80 : 70 // Free emails are more likely valid

  return {
    status: 'UNKNOWN', // Can't verify mailbox without SMTP
    score,
    metadata: {
      domain,
      mxRecords,
      mxFound: true,
      domainExists: true,
      syntaxValid: true,
      disposable: false,
      freeEmail,
    },
    validatedAt: new Date(),
  }
}

/**
 * SMTP verification (advanced - requires connecting to mail server)
 * 
 * WARNING: This is complex and can get your IP blocked if done incorrectly
 * Most mail servers block SMTP verification attempts
 */
async function verifySMTP(email: string, mxRecord: string): Promise<boolean> {
  // This would require:
  // 1. Connecting to mail server on port 25
  // 2. Sending SMTP commands (HELO, MAIL FROM, RCPT TO)
  // 3. Parsing responses
  // 4. Handling greylisting, rate limits, etc.
  // 
  // Most servers block this now to prevent spam
  // This is why services like ZeroBounce exist
  
  return false // Not implemented - too complex/risky
}

