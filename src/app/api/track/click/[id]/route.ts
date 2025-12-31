import { NextResponse } from 'next/server'
import { logEmailEvent } from '@/lib/tracking'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.redirect('/')
    }

    // Get sendId from the URL
    const sendId = id

    // Fetch email send to get contactId
    const { db } = await import('@/lib/db')
    const emailSend = await db.emailSend.findUnique({
      where: { id: sendId },
      include: { contact: true },
    })

    if (emailSend && emailSend.contactId) {
      // Log click event
      await logEmailEvent(
        sendId,
        emailSend.contactId,
        'CLICKED',
        url
      )
    }

    // Redirect to the original URL
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Error tracking email click:', error)
    // Still redirect even on error
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url') || '/'
    return NextResponse.redirect(url)
  }
}

