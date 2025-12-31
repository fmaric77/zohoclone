'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DailyEvent {
  date: string
  type: string
  count: number
}

interface EventCount {
  type: string
  count: number
}

interface AnalyticsChartsProps {
  dailyEvents: DailyEvent[]
  eventCounts: EventCount[]
}

export function AnalyticsCharts({ dailyEvents, eventCounts }: AnalyticsChartsProps) {
  // Group daily events by date
  const dailyData = dailyEvents.reduce((acc: any[], event) => {
    const existing = acc.find((d) => d.date === event.date)
    if (existing) {
      existing[event.type] = (existing[event.type] || 0) + event.count
    } else {
      acc.push({
        date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        [event.type]: event.count,
      })
    }
    return acc
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Daily Events</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="SENT" stroke="#3b82f6" name="Sent" />
            <Line type="monotone" dataKey="DELIVERED" stroke="#10b981" name="Delivered" />
            <Line type="monotone" dataKey="OPENED" stroke="#f59e0b" name="Opened" />
            <Line type="monotone" dataKey="CLICKED" stroke="#ef4444" name="Clicked" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Event Types</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={eventCounts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="type" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
              }}
            />
            <Bar dataKey="count" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

