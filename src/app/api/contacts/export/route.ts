import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tagId = searchParams.get('tagId')
    const contactIds = searchParams.get('contactIds')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (tagId) {
      where.tags = { some: { tagId } }
    }

    if (contactIds) {
      where.id = { in: contactIds.split(',') }
    }

    const contacts = await db.contact.findMany({
      where,
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Build CSV content
    const headers = ['email', 'firstName', 'lastName', 'status', 'tags', 'subscribedAt', 'customFields']
    const rows = contacts.map((contact) => {
      const tags = contact.tags.map((ct) => ct.tag.name).join(';')
      const customFields = contact.customFields 
        ? JSON.stringify(contact.customFields) 
        : ''

      return [
        escapeCsvField(contact.email),
        escapeCsvField(contact.firstName || ''),
        escapeCsvField(contact.lastName || ''),
        contact.status,
        escapeCsvField(tags),
        contact.subscribedAt.toISOString(),
        escapeCsvField(customFields),
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting contacts:', error)
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    )
  }
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

