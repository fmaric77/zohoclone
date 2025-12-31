'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EmailEditor } from '@/components/email-editor'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CampaignEditPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subject, setSubject] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchCampaign(params.id as string)
    }
  }, [params.id])

  const fetchCampaign = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data)
        setSubject(data.subject || '')
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (design: any, html: string) => {
    if (!campaign) return
    setSaving(true)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          designJson: design,
          htmlContent: html,
        }),
      })

      if (response.ok) {
        toast.success('Campaign saved successfully!')
      } else {
        toast.error('Failed to save campaign')
      }
    } catch (error) {
      toast.error('Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = (html: string) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading campaign...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400">Campaign not found</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-4">
        <Link href={`/campaigns/${campaign.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-100">{campaign.name}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <EmailEditor
          designJson={campaign.designJson}
          subject={subject}
          onSubjectChange={setSubject}
          onSave={handleSave}
          onPreview={handlePreview}
        />
      </div>
    </div>
  )
}

