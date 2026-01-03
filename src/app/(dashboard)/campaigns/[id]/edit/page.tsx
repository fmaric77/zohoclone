'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EmailEditor } from '@/components/email-editor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Save, ChevronDown, X, Users } from 'lucide-react'
import Link from 'next/link'

interface Tag {
  id: string
  name: string
  color: string
}

export default function CampaignEditPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subject, setSubject] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  useEffect(() => {
    fetchTags()
    if (params.id) {
      fetchCampaign(params.id as string)
    }
  }, [params.id])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const fetchCampaign = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data)
        setSubject(data.subject || '')
        // Set selected tags from campaign data
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTagIds(data.tags.map((t: any) => t.tagId || t.tag?.id))
        }
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = async (tagId: string) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId]
    
    setSelectedTagIds(newTagIds)
    
    // Save tags to backend
    try {
      const response = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: newTagIds }),
      })
      
      if (!response.ok) {
        // Revert on failure
        setSelectedTagIds(selectedTagIds)
        toast.error('Failed to update target groups')
      }
    } catch (error) {
      setSelectedTagIds(selectedTagIds)
      toast.error('Failed to update target groups')
    }
  }

  const removeTag = async (tagId: string) => {
    const newTagIds = selectedTagIds.filter(id => id !== tagId)
    setSelectedTagIds(newTagIds)
    
    try {
      const response = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: newTagIds }),
      })
      
      if (!response.ok) {
        setSelectedTagIds(selectedTagIds)
        toast.error('Failed to update target groups')
      }
    } catch (error) {
      setSelectedTagIds(selectedTagIds)
      toast.error('Failed to update target groups')
    }
  }

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id))

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
        
        <div className="ml-auto flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 hover:bg-slate-700"
              >
                {selectedTagIds.length === 0
                  ? 'All Contacts'
                  : `${selectedTagIds.length} group${selectedTagIds.length > 1 ? 's' : ''}`}
                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {tags.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-slate-400">
                  No groups available
                </div>
              ) : (
                tags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    checked={selectedTagIds.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedTags.length > 0 && (
            <div className="flex gap-1">
              {selectedTags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="pl-2 pr-1 py-0.5 text-xs"
                  style={{ borderColor: tag.color, borderWidth: 1 }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    className="ml-1 hover:bg-slate-600 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedTags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedTags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
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

