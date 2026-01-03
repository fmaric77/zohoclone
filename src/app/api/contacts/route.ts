import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateEmail } from '@/lib/zerobounce'

const contactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum(['SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED']).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  tagIds: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const tagId = searchParams.get('tagId')
    const search = searchParams.get('search')

    const where: any = {}
    if (status) where.status = status
    if (tagId) {
      where.tags = { some: { tagId } }
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        include: {
          tags: {
            include: { tag: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.contact.count({ where }),
    ])

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    const { tagIds, ...contactData } = data

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
      const validationResult = await validateEmail(contactData.email, true)
      if (validationResult) {
        validationData = {
          validationStatus: validationResult.status,
          validatedAt: validationResult.validatedAt,
          validationScore: validationResult.score,
          validationMetadata: validationResult.metadata,
        }
      }
    } catch (validationError: any) {
      // Don't block contact creation if validation fails
      console.warn(`Validation failed for ${contactData.email}:`, validationError.message)
    }

    const contact = await db.contact.create({
      data: {
        ...contactData,
        validationStatus: validationData.validationStatus,
        validatedAt: validationData.validatedAt,
        validationScore: validationData.validationScore,
        validationMetadata: validationData.validationMetadata || {},
        tags: tagIds
          ? {
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}

