import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyUnsubscribeToken, logEmailEvent } from '@/lib/tracking'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string[] }> }
) {
  try {
    const { token: tokenSegments } = await params
    // Catch-all route returns array - we only need the first segment (the actual token)
    const token = tokenSegments[0]
    const contactId = verifyUnsubscribeToken(token)

    if (!contactId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    const contact = await db.contact.findUnique({
      where: { id: contactId },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Error fetching unsubscribe info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unsubscribe info' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string[] }> }
) {
  try {
    const { token: tokenSegments } = await params
    // Catch-all route returns array - we only need the first segment (the actual token)
    const token = tokenSegments[0]
    const { feedback } = await request.json()
    const contactId = verifyUnsubscribeToken(token)

    if (!contactId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Update contact status
    await db.contact.update({
      where: { id: contactId },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    })

    // Log unsubscribe event for all pending sends
    const pendingSends = await db.emailSend.findMany({
      where: {
        contactId,
        status: { in: ['PENDING', 'SENT', 'DELIVERED'] },
      },
    })

    for (const send of pendingSends) {
      await logEmailEvent(
        send.id,
        contactId,
        'UNSUBSCRIBED',
        undefined,
        feedback ? { feedback } : undefined
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing unsubscribe:', error)
    return NextResponse.json(
      { error: 'Failed to process unsubscribe' },
      { status: 500 }
    )
  }
}

