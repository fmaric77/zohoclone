import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logEmailEvent } from '@/lib/tracking'

interface SNSMessage {
  Type: string
  MessageId: string
  TopicArn: string
  Message: string
  Timestamp: string
  SignatureVersion: string
  Signature: string
  SigningCertURL: string
  UnsubscribeURL: string
}

interface SESNotification {
  notificationType: 'Bounce' | 'Complaint' | 'Delivery'
  mail: {
    messageId: string
    timestamp: string
    source: string
    destination: string[]
  }
  bounce?: {
    bounceType: string
    bounceSubType: string
    bouncedRecipients: Array<{
      emailAddress: string
      action?: string
      status?: string
    }>
    timestamp: string
  }
  complaint?: {
    complainedRecipients: Array<{
      emailAddress: string
    }>
    timestamp: string
    complaintFeedbackType?: string
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    let message: SNSMessage

    try {
      message = JSON.parse(body)
    } catch {
      // If not JSON, might be direct SES notification
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
    }

    // Handle SNS subscription confirmation
    if (message.Type === 'SubscriptionConfirmation') {
      // In production, you should verify the subscription URL
      console.log('SNS Subscription Confirmation received')
      return NextResponse.json({ message: 'Subscription confirmed' })
    }

    // Handle SNS notification
    if (message.Type === 'Notification') {
      let notification: SESNotification

      try {
        notification = JSON.parse(message.Message)
      } catch {
        return NextResponse.json({ error: 'Invalid notification format' }, { status: 400 })
      }

      const { notificationType, mail } = notification

      // Find email send by messageId
      const emailSend = await db.emailSend.findFirst({
        where: {
          messageId: mail.messageId,
        },
        include: {
          contact: true,
        },
      })

      if (!emailSend) {
        console.warn(`Email send not found for messageId: ${mail.messageId}`)
        return NextResponse.json({ message: 'Email send not found' })
      }

      // Handle bounce
      if (notificationType === 'Bounce' && notification.bounce) {
        const { bounce } = notification
        const isHardBounce = bounce.bounceType === 'Permanent'

        // Log bounce event
        await logEmailEvent(
          emailSend.id,
          emailSend.contactId,
          'BOUNCED',
          undefined,
          {
            bounceType: bounce.bounceType,
            bounceSubType: bounce.bounceSubType,
          }
        )

        // If hard bounce, mark contact as bounced
        if (isHardBounce) {
          await db.contact.update({
            where: { id: emailSend.contactId },
            data: {
              status: 'BOUNCED',
            },
          })
        }
      }

      // Handle complaint
      if (notificationType === 'Complaint' && notification.complaint) {
        const { complaint } = notification

        // Log complaint event
        await logEmailEvent(
          emailSend.id,
          emailSend.contactId,
          'COMPLAINED',
          undefined,
          {
            complaintFeedbackType: complaint.complaintFeedbackType,
          }
        )

        // Mark contact as unsubscribed
        await db.contact.update({
          where: { id: emailSend.contactId },
          data: {
            status: 'UNSUBSCRIBED',
            unsubscribedAt: new Date(),
          },
        })
      }

      // Handle delivery
      if (notificationType === 'Delivery') {
        await logEmailEvent(
          emailSend.id,
          emailSend.contactId,
          'DELIVERED'
        )

        await db.emailSend.update({
          where: { id: emailSend.id },
          data: {
            status: 'DELIVERED',
          },
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ message: 'Unknown message type' })
  } catch (error) {
    console.error('Error processing SES webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({ status: 'ok' })
}

