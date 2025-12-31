import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['tag', 'untag', 'delete']),
  contactIds: z.array(z.string()).min(1),
  tagId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, contactIds, tagId } = bulkActionSchema.parse(body)

    const results = {
      processed: 0,
      errors: [] as string[],
    }

    switch (action) {
      case 'tag':
        if (!tagId) {
          return NextResponse.json(
            { error: 'Tag ID is required for tag action' },
            { status: 400 }
          )
        }

        // Verify tag exists
        const tag = await db.tag.findUnique({ where: { id: tagId } })
        if (!tag) {
          return NextResponse.json(
            { error: 'Tag not found' },
            { status: 404 }
          )
        }

        // Create contact tags (ignore duplicates)
        for (const contactId of contactIds) {
          try {
            await db.contactTag.upsert({
              where: {
                contactId_tagId: {
                  contactId,
                  tagId,
                },
              },
              create: {
                contactId,
                tagId,
              },
              update: {},
            })
            results.processed++
          } catch (error: any) {
            results.errors.push(`Failed to tag contact ${contactId}: ${error.message}`)
          }
        }
        break

      case 'untag':
        if (!tagId) {
          return NextResponse.json(
            { error: 'Tag ID is required for untag action' },
            { status: 400 }
          )
        }

        // Remove tags from contacts
        const deleteResult = await db.contactTag.deleteMany({
          where: {
            contactId: { in: contactIds },
            tagId,
          },
        })
        results.processed = deleteResult.count
        break

      case 'delete':
        // Delete contacts
        for (const contactId of contactIds) {
          try {
            await db.contact.delete({
              where: { id: contactId },
            })
            results.processed++
          } catch (error: any) {
            results.errors.push(`Failed to delete contact ${contactId}: ${error.message}`)
          }
        }
        break
    }

    return NextResponse.json({
      success: true,
      action,
      processed: results.processed,
      errors: results.errors,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error processing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk action' },
      { status: 500 }
    )
  }
}

