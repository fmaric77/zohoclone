'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users } from 'lucide-react'

export interface Campaign {
  id: string
  name: string
  subject: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED'
  scheduledAt: string | null
  createdAt: string
  tags: Array<{ tag: { id: string; name: string; color: string } }>
  _count: { emailSends: number }
}

interface CampaignCardProps {
  campaign: Campaign
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  SCHEDULED: 'secondary',
  SENDING: 'default',
  SENT: 'default',
  CANCELLED: 'destructive',
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="bg-slate-900 border-slate-800 hover:border-amber-400 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-slate-100">{campaign.name}</CardTitle>
            <Badge variant={statusVariants[campaign.status] || 'default'}>
              {campaign.status}
            </Badge>
          </div>
          <CardDescription className="text-slate-400">
            {campaign.subject}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {campaign._count.emailSends} sends
            </div>
            {campaign.scheduledAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(campaign.scheduledAt).toLocaleDateString()}
              </div>
            )}
          </div>
          {campaign.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {campaign.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{ borderColor: tag.color }}
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

