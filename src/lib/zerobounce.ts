import { validateEmailCustom } from './custom-validator'

export type ValidationStatus = 'VALID' | 'INVALID' | 'CATCH_ALL' | 'UNKNOWN' | 'NOT_VALIDATED'

export interface ZeroBounceResponse {
  address: string
  status: string // 'valid', 'invalid', 'catch-all', 'unknown', etc.
  sub_status: string
  free_email: boolean
  did_you_mean: string | null
  account: string
  domain: string
  domain_age_days: string
  smtp_provider: string
  mx_found: string
  mx_record: string
  firstname: string
  lastname: string
  gender: string
  country: string
  region: string
  city: string
  zipcode: string
  processed_at: string
}

export interface ValidationResult {
  status: ValidationStatus
  score: number // 0-100
  metadata: Partial<ZeroBounceResponse>
  validatedAt: Date
}

// Simple in-memory cache to avoid redundant API calls
// In production, consider using Redis or similar
const validationCache = new Map<string, { result: ValidationResult; expiresAt: number }>()
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Maps ZeroBounce API status to our ValidationStatus enum
 */
function mapZeroBounceStatus(zbStatus: string): ValidationStatus {
  const status = zbStatus.toLowerCase()
  
  if (status === 'valid') {
    return 'VALID'
  } else if (status === 'invalid') {
    return 'INVALID'
  } else if (status === 'catch-all' || status === 'catchall') {
    return 'CATCH_ALL'
  } else if (status === 'unknown') {
    return 'UNKNOWN'
  }
  
  // Default to UNKNOWN for any unrecognized status
  return 'UNKNOWN'
}

/**
 * Calculates a validation score (0-100) based on ZeroBounce response
 */
function calculateScore(response: ZeroBounceResponse): number {
  let score = 0
  
  if (response.status === 'valid') {
    score = 100
  } else if (response.status === 'catch-all' || response.status === 'catchall') {
    score = 70 // Catch-all emails are risky but potentially valid
  } else if (response.status === 'unknown') {
    score = 50 // Unknown status - moderate risk
  } else if (response.status === 'invalid') {
    score = 0
  }
  
  // Adjust score based on sub_status
  if (response.sub_status) {
    const subStatus = response.sub_status.toLowerCase()
    if (subStatus.includes('disposable') || subStatus.includes('role')) {
      score = Math.max(0, score - 20)
    }
  }
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Validates an email address using custom validator (DNS/MX checks)
 * Falls back to ZeroBounce API if configured
 * 
 * @param email - Email address to validate
 * @param useCache - Whether to use cached results (default: true)
 * @returns Validation result or null if validation fails
 */
export async function validateEmail(
  email: string,
  useCache: boolean = true
): Promise<ValidationResult | null> {
  // Check cache first
  if (useCache) {
    const cached = validationCache.get(email)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result
    }
  }

  // Use custom validator (always available)
  try {
    const customResult = await validateEmailCustom(email)
    
    // Convert custom result to ValidationResult format
    const result: ValidationResult = {
      status: customResult.status,
      score: customResult.score,
      metadata: {
        address: email,
        status: customResult.status.toLowerCase(),
        sub_status: customResult.metadata.disposable ? 'disposable' : '',
        free_email: customResult.metadata.freeEmail || false,
        did_you_mean: null,
        account: email.split('@')[0],
        domain: customResult.metadata.domain,
        domain_age_days: '',
        smtp_provider: '',
        mx_found: customResult.metadata.mxFound ? 'yes' : 'no',
        mx_record: customResult.metadata.mxRecords.join(', '),
        processed_at: customResult.validatedAt.toISOString(),
      },
      validatedAt: customResult.validatedAt,
    }

    // Cache the result
    if (useCache) {
      validationCache.set(email, {
        result,
        expiresAt: Date.now() + CACHE_TTL_MS,
      })
    }

    return result
  } catch (error: any) {
    console.error(`Error validating email ${email} with custom validator:`, error.message)
    
    // Fallback to ZeroBounce if configured (optional)
    const apiKey = process.env.ZEROBOUNCE_API_KEY
    if (apiKey) {
      try {
        const url = `https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (response.ok) {
          const data: ZeroBounceResponse = await response.json()
          const validationStatus = mapZeroBounceStatus(data.status)
          const score = calculateScore(data)
          
          const result: ValidationResult = {
            status: validationStatus,
            score,
            metadata: {
              address: data.address,
              status: data.status,
              sub_status: data.sub_status,
              free_email: data.free_email,
              did_you_mean: data.did_you_mean,
              account: data.account,
              domain: data.domain,
              domain_age_days: data.domain_age_days,
              smtp_provider: data.smtp_provider,
              mx_found: data.mx_found,
              mx_record: data.mx_record,
              processed_at: data.processed_at,
            },
            validatedAt: new Date(),
          }

          // Cache the result
          if (useCache) {
            validationCache.set(email, {
              result,
              expiresAt: Date.now() + CACHE_TTL_MS,
            })
          }

          return result
        }
      } catch (zbError: any) {
        console.warn(`ZeroBounce fallback failed: ${zbError.message}`)
      }
    }
    
    // Return null if both validators fail
    return null
  }
}

/**
 * Validates multiple emails with rate limiting protection
 * Adds a small delay between requests to avoid hitting rate limits
 */
export async function validateEmails(
  emails: string[],
  delayMs: number = 100
): Promise<Map<string, ValidationResult | null>> {
  const results = new Map<string, ValidationResult | null>()
  
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]
    const result = await validateEmail(email)
    results.set(email, result)
    
    // Add delay between requests (except for the last one)
    if (i < emails.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
}

/**
 * Clears the validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear()
}

/**
 * Checks if an email should be considered valid for sending
 */
export function isValidForSending(status: ValidationStatus): boolean {
  // Allow VALID, CATCH_ALL, UNKNOWN, and NOT_VALIDATED for backward compatibility
  return status === 'VALID' || status === 'CATCH_ALL' || status === 'UNKNOWN' || status === 'NOT_VALIDATED'
}

