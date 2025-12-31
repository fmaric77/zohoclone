import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import Papa from 'papaparse'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
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
    }

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

        const existing = await db.contact.findUnique({
          where: { email },
        })

        if (existing) {
          await db.contact.update({
            where: { email },
            data: {
              firstName: firstName || existing.firstName,
              lastName: lastName || existing.lastName,
              customFields: { ...existing.customFields, ...customFields },
            },
          })
          results.updated++
        } else {
          await db.contact.create({
            data: {
              email,
              firstName,
              lastName,
              customFields,
              status: 'SUBSCRIBED',
            },
          })
          results.created++
        }
      } catch (error: any) {
        results.errors.push(`Error processing row: ${error.message}`)
      }
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

