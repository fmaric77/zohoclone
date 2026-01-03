import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  designJson: z.any().optional(),
  htmlContent: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
        },
        emailSends: {
          include: {
            contact: true,
          },
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { emailSends: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Calculate potential recipients based on campaign tags
    const tagIds = campaign.tags.map((ct: { tagId: string }) => ct.tagId)
    let potentialRecipients = 0

    if (tagIds.length > 0) {
      potentialRecipients = await db.contact.count({
        where: {
          status: 'SUBSCRIBED',
          tags: {
            some: {
              tagId: {
                in: tagIds,
              },
            },
          },
        },
      })
    } else {
      // If no tags, count all subscribed contacts
      potentialRecipients = await db.contact.count({
        where: {
          status: 'SUBSCRIBED',
        },
      })
    }

    return NextResponse.json({
      ...campaign,
      potentialRecipients,
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
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

    const { tagIds, scheduledAt, ...updateData } = data

    // Update tags if provided
    if (tagIds !== undefined) {
      await db.campaignTag.deleteMany({
        where: { campaignId: id },
      })
      if (tagIds.length > 0) {
        await db.campaignTag.createMany({
          data: tagIds.map((tagId: string) => ({
            campaignId: id,
            tagId,
          })),
        })
      }
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        ...updateData,
        scheduledAt: scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : undefined,
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
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
    await db.campaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}

