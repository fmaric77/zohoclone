import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { Users, Mail, BarChart3, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let contactsCount = 0
  let campaignsCount = 0
  let sentCount = 0
  let openedCount = 0

  try {
    const [contacts, campaigns, sent, opened] = await Promise.all([
      db.contact.count({ where: { status: 'SUBSCRIBED' } }),
      db.campaign.count(),
      db.emailSend.count({ where: { status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] } } }),
      db.emailEvent.count({ where: { type: 'OPENED' } }),
    ])
    contactsCount = contacts
    campaignsCount = campaigns
    sentCount = sent
    openedCount = opened
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Continue with default values of 0
  }

  const openRate = sentCount > 0 ? ((openedCount / sentCount) * 100).toFixed(1) : '0'

  const stats = [
    {
      title: 'Subscribed Contacts',
      value: contactsCount,
      icon: Users,
      description: 'Active subscribers',
    },
    {
      title: 'Campaigns',
      value: campaignsCount,
      icon: Mail,
      description: 'Total campaigns',
    },
    {
      title: 'Emails Sent',
      value: sentCount,
      icon: TrendingUp,
      description: 'Total emails delivered',
    },
    {
      title: 'Open Rate',
      value: `${openRate}%`,
      icon: BarChart3,
      description: 'Average open rate',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome to your email campaign platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest campaigns and sends</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">No recent activity</p>
        </CardContent>
      </Card>
    </div>
  )
}

