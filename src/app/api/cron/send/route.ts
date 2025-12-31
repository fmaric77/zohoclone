import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/ses'
import { processEmailContent, processMergeTags } from '@/lib/email-processor'
import { generateUnsubscribeToken } from '@/lib/tracking'

// This endpoint should be called by a cron job (Vercel Cron or similar)
// to send scheduled campaigns
export async function GET(request: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find campaigns scheduled to send now or in the past
    const now = new Date()
    const scheduledCampaigns = await db.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now,
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    if (scheduledCampaigns.length === 0) {
      return NextResponse.json({ message: 'No campaigns to send' })
    }

    const results = []

    for (const campaign of scheduledCampaigns) {
      if (!campaign.htmlContent) {
        continue
      }

      // Update campaign status
      await db.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'SENDING',
          sentAt: new Date(),
        },
      })

      // Get contacts based on campaign tags
      const tagIds = campaign.tags.map((ct) => ct.tagId)
      let contacts

      if (tagIds.length > 0) {
        contacts = await db.contact.findMany({
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
        contacts = await db.contact.findMany({
          where: {
            status: 'SUBSCRIBED',
          },
        })
      }

      let sent = 0
      let failed = 0

      for (const contact of contacts) {
        try {
          // Create email send record
          const emailSend = await db.emailSend.create({
            data: {
              campaignId: campaign.id,
              contactId: contact.id,
              status: 'PENDING',
            },
          })

          // Generate unsubscribe token
          const unsubscribeToken = generateUnsubscribeToken(contact.id)

          // Process email content
          const processedHtml = processEmailContent(
            campaign.htmlContent!,
            contact,
            emailSend.id,
            unsubscribeToken
          )

          // Process subject line with merge tags
          const processedSubject = processMergeTags(campaign.subject, contact)

          // Send email via SES
          const messageId = await sendEmail({
            to: contact.email,
            subject: processedSubject,
            html: processedHtml,
          })

          // Update email send record
          await db.emailSend.update({
            where: { id: emailSend.id },
            data: {
              messageId,
              status: 'SENT',
              sentAt: new Date(),
            },
          })

          // Log event
          await db.emailEvent.create({
            data: {
              sendId: emailSend.id,
              contactId: contact.id,
              type: 'SENT',
            },
          })

          sent++
        } catch (error: any) {
          failed++
          console.error(`Error sending to ${contact.email}:`, error)
        }
      }

      // Update campaign status to SENT
      await db.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'SENT',
        },
      })

      results.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        sent,
        failed,
      })
    }

    return NextResponse.json({
      success: true,
      campaignsProcessed: results.length,
      results,
    })
  } catch (error: any) {
    console.error('Error processing scheduled campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled campaigns', details: error.message },
      { status: 500 }
    )
  }
}

