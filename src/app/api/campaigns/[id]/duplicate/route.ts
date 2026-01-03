import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch the original campaign
    const original = await db.campaign.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    })

    if (!original) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Create duplicate campaign
    const duplicate = await db.campaign.create({
      data: {
        name: `${original.name} (Copy)`,
        subject: original.subject,
        designJson: original.designJson ?? undefined,
        htmlContent: original.htmlContent ?? undefined,
        status: 'DRAFT',
        // Reset scheduling
        scheduledAt: null,
        sentAt: null,
        // Copy tags
        tags: original.tags.length > 0
          ? {
              create: original.tags.map((ct: { tagId: string }) => ({
                tagId: ct.tagId,
              })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    return NextResponse.json(duplicate, { status: 201 })
  } catch (error) {
    console.error('Error duplicating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate campaign' },
      { status: 500 }
    )
  }
}

