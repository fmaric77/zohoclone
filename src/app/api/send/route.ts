import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/ses'
import { processEmailContent, processMergeTags } from '@/lib/email-processor'
import { generateUnsubscribeToken } from '@/lib/tracking'
import { isValidForSending } from '@/lib/zerobounce'
import { emailRateLimiter } from '@/lib/rate-limiter'

// Batch size optimized for Vercel free tier (60s timeout)
// At 14 emails/sec + DB operations, ~200 emails keeps us safe under 60s
const DEFAULT_BATCH_SIZE = 200

export async function POST(request: Request) {
  let campaignId: string | undefined
  try {
    const body = await request.json()
    campaignId = body.campaignId
    const { resend, resendMode, resume, batchSize = DEFAULT_BATCH_SIZE } = body

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

    // Allow resuming stuck SENDING campaigns
    const isResuming = resume && campaign.status === 'SENDING'

    // Get contacts based on campaign tags
    const tagIds = campaign.tags.map((ct: { tagId: string }) => ct.tagId)
    
    // Use Prisma's inferred type
    let contacts: Awaited<ReturnType<typeof db.contact.findMany>>

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

    // If resuming a stuck campaign, filter out contacts who already received successfully
    if (isResuming) {
      const existingSends = await db.emailSend.findMany({
        where: { 
          campaignId,
          status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] }
        },
        select: { contactId: true },
      })
      const sentContactIds = new Set(existingSends.map((s: { contactId: string }) => s.contactId))
      contacts = contacts.filter((c: (typeof contacts)[number]) => !sentContactIds.has(c.id))
    }

    // If resending to new contacts only, filter out those who already received
    if (resend && resendMode === 'new') {
      const existingSends = await db.emailSend.findMany({
        where: { campaignId },
        select: { contactId: true },
      })
      const sentContactIds = new Set(existingSends.map((s: { contactId: string }) => s.contactId))
      contacts = contacts.filter((c: (typeof contacts)[number]) => !sentContactIds.has(c.id))
    }

    // Filter out invalid emails based on validation status
    const initialContactCount = contacts.length
    const validContacts = contacts.filter((contact: (typeof contacts)[number]) => 
      isValidForSending(contact.validationStatus || 'NOT_VALIDATED')
    )
    const skippedInvalid = initialContactCount - validContacts.length
    contacts = validContacts

    // Calculate total before batching
    const totalContacts = contacts.length

    if (contacts.length === 0) {
      // If resuming/resending and no contacts left, mark as SENT
      if (isResuming || resend) {
        await db.campaign.update({
          where: { id: campaignId },
          data: { status: 'SENT' },
        })
        return NextResponse.json({
          success: true,
          sent: 0,
          failed: 0,
          remaining: 0,
          total: 0,
          message: 'All contacts have already received this campaign',
        })
      }

      // Provide more diagnostic information
      const tagNames = campaign.tags.map((ct: { tag: { name: string } }) => ct.tag.name).join(', ')
      const diagnosticMessage = tagIds.length > 0
        ? `No subscribed contacts found with tags: ${tagNames || 'none'}`
        : 'No subscribed contacts found in database'
      
      return NextResponse.json({
        success: false,
        sent: 0,
        failed: 0,
        remaining: 0,
        total: 0,
        errors: [diagnosticMessage],
        message: resend ? 'No new contacts to send to' : diagnosticMessage,
      })
    }

    // Apply batch limit for Vercel free tier compatibility
    const batchContacts = contacts.slice(0, batchSize)
    const remaining = contacts.length - batchContacts.length

    // Update campaign status (skip if already SENDING from a resume)
    if (!isResuming) {
      await db.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENDING',
          sentAt: resend ? campaign.sentAt : new Date(), // Keep original sentAt on resend
        },
      })
    }

    // Create email sends and send emails
    const results = {
      sent: 0,
      failed: 0,
      skippedInvalid: skippedInvalid,
      errors: [] as string[],
    }

    for (const contact of batchContacts) {
      let emailSend: any = null
      try {
        // Create email send record
        emailSend = await db.emailSend.create({
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

        // Wait for rate limit slot (max 14 emails per second)
        await emailRateLimiter.waitForSlot()

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
        const errorMsg = error.message || error.toString() || 'Unknown error'
        results.errors.push(`Failed to send to ${contact.email}: ${errorMsg}`)
        console.error(`Error sending to ${contact.email}:`, error)
        
        // Update email send record with failure status if it was created
        if (emailSend) {
          try {
            await db.emailSend.update({
              where: { id: emailSend.id },
              data: {
                status: 'FAILED',
              },
            })
          } catch (updateError) {
            console.error('Failed to update email send status:', updateError)
          }
        }
      }
    }

    // Update campaign status based on results
    // Only mark as SENT if no more emails remaining
    if (remaining === 0) {
      if (results.sent > 0) {
        await db.campaign.update({
          where: { id: campaignId },
          data: {
            status: 'SENT',
            sentAt: resend ? campaign.sentAt : new Date(),
          },
        })
      } else {
        // If no emails were sent and nothing remaining, revert to DRAFT
        await db.campaign.update({
          where: { id: campaignId },
          data: {
            status: 'DRAFT',
          },
        })
      }
    }
    // If remaining > 0, keep status as SENDING for next batch

    return NextResponse.json({
      success: results.sent > 0,
      sent: results.sent,
      failed: results.failed,
      remaining: remaining,
      total: totalContacts,
      skippedInvalid: results.skippedInvalid,
      errors: results.errors,
      message: results.sent === 0 
        ? 'No emails were sent. Check errors for details.' 
        : remaining > 0
        ? `Batch complete. ${remaining} more emails to send.`
        : results.skippedInvalid > 0
        ? `${results.skippedInvalid} invalid email(s) were skipped.`
        : undefined,
    })
  } catch (error: any) {
    console.error('Error sending campaign:', error)
    
    // Revert campaign status to DRAFT if sending failed
    if (campaignId) {
      try {
        await db.campaign.update({
          where: { id: campaignId },
          data: {
            status: 'DRAFT',
          },
        })
      } catch (updateError) {
        console.error('Failed to revert campaign status:', updateError)
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to send campaign', details: error.message },
      { status: 500 }
    )
  }
}

