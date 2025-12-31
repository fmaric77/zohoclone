import { db } from './db'
import crypto from 'crypto'

export function generateUnsubscribeToken(contactId: string): string {
  const secret = process.env.APP_SECRET || 'change-this-in-production'
  const hash = crypto
    .createHash('sha256')
    .update(`${contactId}-${secret}`)
    .digest('hex')
  return `${contactId}-${hash.substring(0, 16)}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split('-')
  if (parts.length < 2) return null
  return parts[0] // Return contactId
}

export async function logEmailEvent(
  sendId: string,
  contactId: string,
  type: 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'COMPLAINED' | 'UNSUBSCRIBED',
  url?: string,
  metadata?: Record<string, any>
) {
  try {
    await db.emailEvent.create({
      data: {
        sendId,
        contactId,
        type,
        url: url || null,
        metadata: metadata || {},
      },
    })

    // Update EmailSend status
    const send = await db.emailSend.findUnique({ where: { id: sendId } })
    if (send) {
      const updates: any = {}
      
      if (type === 'OPENED' && !send.openedAt) {
        updates.openedAt = new Date()
        updates.status = 'OPENED'
      }
      
      if (type === 'CLICKED' && !send.clickedAt) {
        updates.clickedAt = new Date()
        updates.status = 'CLICKED'
      }
      
      if (type === 'BOUNCED') {
        updates.status = 'BOUNCED'
      }
      
      if (type === 'COMPLAINED') {
        updates.status = 'COMPLAINED'
      }

      if (Object.keys(updates).length > 0) {
        await db.emailSend.update({
          where: { id: sendId },
          data: updates,
        })
      }
    }
  } catch (error) {
    console.error('Error logging email event:', error)
  }
}

