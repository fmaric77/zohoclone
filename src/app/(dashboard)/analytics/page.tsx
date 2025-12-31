'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsCharts } from '@/components/analytics-charts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Mail, TrendingUp, MousePointerClick } from 'lucide-react'

interface AnalyticsData {
  eventCounts: Array<{ type: string; count: number }>
  dailyEvents: Array<{ date: string; type: string; count: number }>
  campaigns: Array<{
    id: string
    name: string
    total: number
    sent: number
    opened: number
    clicked: number
    openRate: string
    clickRate: string
  }>
  overall: {
    totalContacts: number
    totalCampaigns: number
    totalSends: number
    totalOpens: number
    totalClicks: number
    openRate: string
    clickRate: string
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('30')
  const [campaignId, setCampaignId] = useState<string>('all')

  useEffect(() => {
    fetchAnalytics()
  }, [days, campaignId])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days })
      if (campaignId !== 'all') {
        params.append('campaignId', campaignId)
      }

      const response = await fetch(`/api/analytics?${params}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-400 py-8">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-400 py-8">Failed to load analytics</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
        <p className="text-slate-400 mt-2">Campaign performance and statistics</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px] bg-slate-900 border-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {data.overall.totalContacts}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Emails Sent
            </CardTitle>
            <Mail className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {data.overall.totalSends}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Open Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {data.overall.openRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data.overall.totalOpens} opens
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Click Rate
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {data.overall.clickRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data.overall.totalClicks} clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card className="bg-slate-900 border-slate-800 mb-8">
        <CardHeader>
          <CardTitle>Performance Charts</CardTitle>
          <CardDescription>Visualize your email campaign performance</CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsCharts
            dailyEvents={data.dailyEvents}
            eventCounts={data.eventCounts}
          />
        </CardContent>
      </Card>

      {/* Campaign Stats */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Top campaigns by performance</CardDescription>
        </CardHeader>
        <CardContent>
          {data.campaigns.length === 0 ? (
            <p className="text-slate-400 text-sm">No campaign data available</p>
          ) : (
            <div className="space-y-4">
              {data.campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 rounded-lg bg-slate-800 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-100">{campaign.name}</h3>
                    <div className="text-sm text-slate-400">
                      {campaign.sent} sent
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Open Rate</p>
                      <p className="text-slate-100 font-semibold">{campaign.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Click Rate</p>
                      <p className="text-slate-100 font-semibold">{campaign.clickRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Clicks</p>
                      <p className="text-slate-100 font-semibold">{campaign.clicked}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

