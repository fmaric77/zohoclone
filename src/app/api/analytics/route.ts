import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const where: any = {
      timestamp: {
        gte: startDate,
      },
    }

    if (campaignId) {
      const emailSends = await db.emailSend.findMany({
        where: { campaignId },
        select: { id: true },
      })
      const sendIds = emailSends.map((s: { id: string }) => s.id)
      where.sendId = { in: sendIds }
    }

    // Get event counts by type
    const eventCounts = await db.emailEvent.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true,
      },
    })

    // Get daily event counts
    let dailyEvents: Array<{ date: string; type: string; count: bigint }>
    
    if (campaignId) {
      const emailSends = await db.emailSend.findMany({
        where: { campaignId },
        select: { id: true },
      })
      const sendIds = emailSends.map((s: { id: string }) => s.id)
      
      dailyEvents = await db.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          type,
          COUNT(*)::int as count
        FROM "EmailEvent"
        WHERE timestamp >= ${startDate}
        AND "sendId" = ANY(${sendIds})
        GROUP BY DATE(timestamp), type
        ORDER BY date ASC
      `
    } else {
      dailyEvents = await db.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          type,
          COUNT(*)::int as count
        FROM "EmailEvent"
        WHERE timestamp >= ${startDate}
        GROUP BY DATE(timestamp), type
        ORDER BY date ASC
      `
    }

    // Get campaign stats
    const campaignStats = await db.campaign.findMany({
      include: {
        _count: {
          select: { emailSends: true },
        },
        emailSends: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Calculate stats for each campaign using EmailEvent counts
    const campaignsWithStats = await Promise.all(
      campaignStats.map(async (campaign: {
        id: string
        name: string
        _count: { emailSends: number }
        emailSends: Array<{ id: string; status: string }>
      }) => {
        const sendIds = campaign.emailSends.map((s: { id: string; status: string }) => s.id)
        const sent = campaign.emailSends.filter((s: { id: string; status: string }) => 
          ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'].includes(s.status)
        ).length
        
        // Count unique opens (one per sendId)
        const openEvents = await db.emailEvent.findMany({
          where: {
            sendId: { in: sendIds },
            type: 'OPENED',
            timestamp: { gte: startDate },
          },
          select: { sendId: true },
          distinct: ['sendId'],
        })
        const opened = openEvents.length
        
        // Count unique clicks (one per sendId)
        const clickEvents = await db.emailEvent.findMany({
          where: {
            sendId: { in: sendIds },
            type: 'CLICKED',
            timestamp: { gte: startDate },
          },
          select: { sendId: true },
          distinct: ['sendId'],
        })
        const clicked = clickEvents.length
        
        const bounced = campaign.emailSends.filter((s: { id: string; status: string }) => s.status === 'BOUNCED').length

        return {
          id: campaign.id,
          name: campaign.name,
          total: campaign._count.emailSends,
          sent,
          opened,
          clicked,
          bounced,
          openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0',
          clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0',
        }
      })
    )

    // Overall stats
    const totalContacts = await db.contact.count({ where: { status: 'SUBSCRIBED' } })
    const totalCampaigns = await db.campaign.count()
    const totalSends = await db.emailSend.count({
      where: {
        status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
        createdAt: { gte: startDate },
      },
    })
    const totalOpens = await db.emailEvent.count({
      where: {
        type: 'OPENED',
        timestamp: { gte: startDate },
      },
    })
    const totalClicks = await db.emailEvent.count({
      where: {
        type: 'CLICKED',
        timestamp: { gte: startDate },
      },
    })

    return NextResponse.json({
      eventCounts: eventCounts.map((e) => ({
        type: e.type,
        count: e._count.id,
      })),
      dailyEvents: dailyEvents.map((e) => ({
        date: e.date,
        type: e.type,
        count: Number(e.count),
      })),
      campaigns: campaignsWithStats,
      overall: {
        totalContacts,
        totalCampaigns,
        totalSends,
        totalOpens,
        totalClicks,
        openRate: totalSends > 0 ? ((totalOpens / totalSends) * 100).toFixed(1) : '0',
        clickRate: totalSends > 0 ? ((totalClicks / totalSends) * 100).toFixed(1) : '0',
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

