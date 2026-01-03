import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateEmail, validateEmails } from '@/lib/zerobounce'
import { z } from 'zod'

const validateSchema = z.object({
  contactId: z.string().optional(),
  contactIds: z.array(z.string()).optional(),
  email: z.string().email().optional(),
  emails: z.array(z.string().email()).optional(),
})

/**
 * POST /api/contacts/validate
 * 
 * Validates one or more contacts/emails
 * 
 * Body options:
 * - contactId: string - Validate a single contact by ID
 * - contactIds: string[] - Validate multiple contacts by ID
 * - email: string - Validate a single email address
 * - emails: string[] - Validate multiple email addresses
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = validateSchema.parse(body)

    const results = {
      validated: 0,
      failed: 0,
      results: [] as Array<{
        identifier: string
        status: 'success' | 'failed'
        validationStatus?: string
        score?: number
        error?: string
      }>,
    }

    // Handle single contact ID
    if (data.contactId) {
      try {
        const contact = await db.contact.findUnique({
          where: { id: data.contactId },
        })

        if (!contact) {
          return NextResponse.json(
            { error: 'Contact not found' },
            { status: 404 }
          )
        }

        const validationResult = await validateEmail(contact.email, false)
        
        if (validationResult) {
          await db.contact.update({
            where: { id: contact.id },
            data: {
              validationStatus: validationResult.status,
              validatedAt: validationResult.validatedAt,
              validationScore: validationResult.score,
              validationMetadata: validationResult.metadata,
            },
          })

          results.validated++
          results.results.push({
            identifier: contact.email,
            status: 'success',
            validationStatus: validationResult.status,
            score: validationResult.score,
          })
        } else {
          results.failed++
          results.results.push({
            identifier: contact.email,
            status: 'failed',
            error: 'Validation API returned no result',
          })
        }
      } catch (error: any) {
        results.failed++
        results.results.push({
          identifier: data.contactId,
          status: 'failed',
          error: error.message || 'Unknown error',
        })
      }
    }
    // Handle multiple contact IDs
    else if (data.contactIds && data.contactIds.length > 0) {
      const contacts = await db.contact.findMany({
        where: {
          id: { in: data.contactIds },
        },
      })

      for (const contact of contacts) {
        try {
          const validationResult = await validateEmail(contact.email, false)
          
          if (validationResult) {
            await db.contact.update({
              where: { id: contact.id },
              data: {
                validationStatus: validationResult.status,
                validatedAt: validationResult.validatedAt,
                validationScore: validationResult.score,
                validationMetadata: validationResult.metadata,
              },
            })

            results.validated++
            results.results.push({
              identifier: contact.email,
              status: 'success',
              validationStatus: validationResult.status,
              score: validationResult.score,
            })
          } else {
            results.failed++
            results.results.push({
              identifier: contact.email,
              status: 'failed',
              error: 'Validation API returned no result',
            })
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error: any) {
          results.failed++
          results.results.push({
            identifier: contact.email,
            status: 'failed',
            error: error.message || 'Unknown error',
          })
        }
      }
    }
    // Handle single email
    else if (data.email) {
      try {
        const validationResult = await validateEmail(data.email, false)
        
        if (validationResult) {
          // Try to find and update existing contact, or just return result
          const contact = await db.contact.findUnique({
            where: { email: data.email },
          })

          if (contact) {
            await db.contact.update({
              where: { id: contact.id },
              data: {
                validationStatus: validationResult.status,
                validatedAt: validationResult.validatedAt,
                validationScore: validationResult.score,
                validationMetadata: validationResult.metadata,
              },
            })
          }

          results.validated++
          results.results.push({
            identifier: data.email,
            status: 'success',
            validationStatus: validationResult.status,
            score: validationResult.score,
          })
        } else {
          results.failed++
          results.results.push({
            identifier: data.email,
            status: 'failed',
            error: 'Validation API returned no result',
          })
        }
      } catch (error: any) {
        results.failed++
        results.results.push({
          identifier: data.email,
          status: 'failed',
          error: error.message || 'Unknown error',
        })
      }
    }
    // Handle multiple emails
    else if (data.emails && data.emails.length > 0) {
      const validationResults = await validateEmails(data.emails, 100)

      for (const [email, validationResult] of validationResults) {
        try {
          if (validationResult) {
            // Try to find and update existing contact
            const contact = await db.contact.findUnique({
              where: { email },
            })

            if (contact) {
              await db.contact.update({
                where: { id: contact.id },
                data: {
                  validationStatus: validationResult.status,
                  validatedAt: validationResult.validatedAt,
                  validationScore: validationResult.score,
                  validationMetadata: validationResult.metadata,
                },
              })
            }

            results.validated++
            results.results.push({
              identifier: email,
              status: 'success',
              validationStatus: validationResult.status,
              score: validationResult.score,
            })
          } else {
            results.failed++
            results.results.push({
              identifier: email,
              status: 'failed',
              error: 'Validation API returned no result',
            })
          }
        } catch (error: any) {
          results.failed++
          results.results.push({
            identifier: email,
            status: 'failed',
            error: error.message || 'Unknown error',
          })
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Please provide contactId, contactIds, email, or emails' },
        { status: 400 }
      )
    }

    return NextResponse.json(results)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error validating contacts:', error)
    return NextResponse.json(
      { error: 'Failed to validate contacts' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/contacts/validate?contactId=xxx
 * 
 * Get validation status for a contact
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const email = searchParams.get('email')

    if (!contactId && !email) {
      return NextResponse.json(
        { error: 'Please provide contactId or email' },
        { status: 400 }
      )
    }

    const contact = contactId
      ? await db.contact.findUnique({ where: { id: contactId } })
      : await db.contact.findUnique({ where: { email: email! } })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      email: contact.email,
      validationStatus: contact.validationStatus,
      validatedAt: contact.validatedAt,
      validationScore: contact.validationScore,
      validationMetadata: contact.validationMetadata,
    })
  } catch (error) {
    console.error('Error fetching validation status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch validation status' },
      { status: 500 }
    )
  }
}

