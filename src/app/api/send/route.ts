import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/ses'
import { processEmailContent, processMergeTags } from '@/lib/email-processor'
import { generateUnsubscribeToken } from '@/lib/tracking'

export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Fetch campaign
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (!campaign.htmlContent) {
      return NextResponse.json(
        { error: 'Campaign has no HTML content' },
        { status: 400 }
      )
    }

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
      // If no tags, send to all subscribed contacts
      contacts = await db.contact.findMany({
        where: {
          status: 'SUBSCRIBED',
        },
      })
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found for this campaign' },
        { status: 400 }
      )
    }

    // Update campaign status
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENDING',
        sentAt: new Date(),
      },
    })

    // Create email sends and send emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const contact of contacts) {
      try {
        // Create email send record
        const emailSend = await db.emailSend.create({
          data: {
            campaignId,
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

        results.sent++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Failed to send to ${contact.email}: ${error.message}`)
        console.error(`Error sending to ${contact.email}:`, error)
      }
    }

    // Update campaign status to SENT
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENT',
      },
    })

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error('Error sending campaign:', error)
    return NextResponse.json(
      { error: 'Failed to send campaign', details: error.message },
      { status: 500 }
    )
  }
}

