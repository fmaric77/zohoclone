import { NextResponse } from 'next/server'
import { logEmailEvent } from '@/lib/tracking'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get sendId from the URL
    const sendId = id

    // Fetch email send to get contactId
    const { db } = await import('@/lib/db')
    const emailSend = await db.emailSend.findUnique({
      where: { id: sendId },
      include: { contact: true },
    })

    if (emailSend && emailSend.contactId) {
      // Log open event
      await logEmailEvent(
        sendId,
        emailSend.contactId,
        'OPENED'
      )
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error tracking email open:', error)
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
      },
    })
  }
}

