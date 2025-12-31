import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum(['SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED']).optional(),
  customFields: z.record(z.any()).optional(),
  tagIds: z.array(z.string()).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
        },
        emailSends: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            campaign: true,
          },
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    const { tagIds, ...updateData } = data

    // Update tags if provided
    if (tagIds !== undefined) {
      await db.contactTag.deleteMany({
        where: { contactId: id },
      })
      if (tagIds.length > 0) {
        await db.contactTag.createMany({
          data: tagIds.map((tagId) => ({
            contactId: id,
            tagId,
          })),
        })
      }
    }

    const contact = await db.contact.update({
      where: { id },
      data: updateData,
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}

