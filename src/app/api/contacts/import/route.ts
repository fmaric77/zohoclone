import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import Papa from 'papaparse'
import { validateEmail } from '@/lib/zerobounce'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tagIdsJson = formData.get('tagIds') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Parse tagIds if provided
    let tagIds: string[] = []
    if (tagIdsJson) {
      try {
        tagIds = JSON.parse(tagIdsJson)
      } catch {
        // Ignore parsing errors, just don't assign tags
      }
    }

    const text = await file.text()
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing errors', details: parseResult.errors },
        { status: 400 }
      )
    }

    const contacts = parseResult.data as any[]
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
      validation: {
        validated: 0,
        valid: 0,
        invalid: 0,
        catchAll: 0,
        unknown: 0,
        failed: 0,
      },
    }

    // Collect contact IDs for tag assignment
    const contactIdsToTag: string[] = []

    for (const row of contacts) {
      try {
        const email = row.email || row.Email || row.EMAIL
        if (!email) {
          results.errors.push(`Row missing email: ${JSON.stringify(row)}`)
          continue
        }

        const firstName = row.firstName || row['First Name'] || row['first_name'] || row.first_name
        const lastName = row.lastName || row['Last Name'] || row['last_name'] || row.last_name

        // Extract custom fields (everything except email, firstName, lastName)
        const customFields: Record<string, any> = {}
        Object.keys(row).forEach((key) => {
          const lowerKey = key.toLowerCase()
          if (
            !['email', 'firstname', 'lastname', 'first name', 'last name'].includes(lowerKey)
          ) {
            customFields[key] = row[key]
          }
        })

        // Validate email (non-blocking - continue even if validation fails)
        let validationData: {
          validationStatus: 'VALID' | 'INVALID' | 'CATCH_ALL' | 'UNKNOWN' | 'NOT_VALIDATED'
          validatedAt: Date | null
          validationScore: number | null
          validationMetadata: Record<string, any> | null
        } = {
          validationStatus: 'NOT_VALIDATED',
          validatedAt: null,
          validationScore: null,
          validationMetadata: null,
        }

        try {
          const validationResult = await validateEmail(email, true)
          if (validationResult) {
            validationData = {
              validationStatus: validationResult.status,
              validatedAt: validationResult.validatedAt,
              validationScore: validationResult.score,
              validationMetadata: validationResult.metadata,
            }
            results.validation.validated++
            
            // Count by status
            if (validationResult.status === 'VALID') {
              results.validation.valid++
            } else if (validationResult.status === 'INVALID') {
              results.validation.invalid++
            } else if (validationResult.status === 'CATCH_ALL') {
              results.validation.catchAll++
            } else if (validationResult.status === 'UNKNOWN') {
              results.validation.unknown++
            }
          } else {
            results.validation.failed++
          }
        } catch (validationError: any) {
          // Don't block import if validation fails
          console.warn(`Validation failed for ${email}:`, validationError.message)
          results.validation.failed++
        }

        const existing = await db.contact.findUnique({
          where: { email },
        })

        if (existing) {
          const existingCustomFields = existing.customFields && typeof existing.customFields === 'object' && !Array.isArray(existing.customFields)
            ? existing.customFields as Record<string, any>
            : {}
          
          await db.contact.update({
            where: { email },
            data: {
              firstName: firstName || existing.firstName,
              lastName: lastName || existing.lastName,
              customFields: { ...existingCustomFields, ...customFields },
              ...(validationData.validatedAt && {
                validationStatus: validationData.validationStatus,
                validatedAt: validationData.validatedAt,
                validationScore: validationData.validationScore,
                validationMetadata: validationData.validationMetadata || {},
              }),
            },
          })
          contactIdsToTag.push(existing.id)
          results.updated++
        } else {
          const newContact = await db.contact.create({
            data: {
              email,
              firstName,
              lastName,
              customFields,
              status: 'SUBSCRIBED',
              validationStatus: validationData.validationStatus,
              validatedAt: validationData.validatedAt,
              validationScore: validationData.validationScore,
              validationMetadata: validationData.validationMetadata || {},
            },
          })
          contactIdsToTag.push(newContact.id)
          results.created++
        }
      } catch (error: any) {
        results.errors.push(`Error processing row: ${error.message}`)
      }
    }

    // Assign tags to all imported/updated contacts
    if (tagIds.length > 0 && contactIdsToTag.length > 0) {
      const tagAssignments = []
      for (const contactId of contactIdsToTag) {
        for (const tagId of tagIds) {
          tagAssignments.push({
            contactId,
            tagId,
          })
        }
      }

      // Use createMany with skipDuplicates to avoid errors on existing assignments
      await db.contactTag.createMany({
        data: tagAssignments,
        skipDuplicates: true,
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    )
  }
}

