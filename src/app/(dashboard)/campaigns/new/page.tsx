'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Save, ChevronDown, X } from 'lucide-react'
import Link from 'next/link'

interface Tag {
  id: string
  name: string
  color: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tags, setTags] = useState<Tag[]>([])
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    scheduledAt: '',
    tagIds: [] as string[],
  })

  useEffect(() => {
    fetchTags()
  }, [])

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

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }))
  }

  const removeTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.filter(id => id !== tagId)
    }))
  }

  const selectedTags = tags.filter(tag => formData.tagIds.includes(tag.id))

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required'
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject line is required'
    }
    
    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt)
      if (scheduledDate < new Date()) {
        newErrors.scheduledAt = 'Scheduled date must be in the future'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledAt: formData.scheduledAt || null,
        }),
      })

      if (response.ok) {
        const campaign = await response.json()
        toast.success('Campaign created successfully!')
        router.push(`/campaigns/${campaign.id}/edit`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create campaign')
      }
    } catch (error) {
      toast.error('Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/campaigns">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-100">New Campaign</h1>
      </div>

      <Card className="bg-slate-900 border-slate-800 max-w-2xl">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Create a new email campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: '' })
                }}
                placeholder="Summer Sale Campaign"
                required
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => {
                  setFormData({ ...formData, subject: e.target.value })
                  if (errors.subject) setErrors({ ...errors, subject: '' })
                }}
                placeholder="Check out our summer sale!"
                required
                className={errors.subject ? 'border-destructive' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-destructive mt-1">{errors.subject}</p>
              )}
            </div>
            <div>
              <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => {
                  setFormData({ ...formData, scheduledAt: e.target.value })
                  if (errors.scheduledAt) setErrors({ ...errors, scheduledAt: '' })
                }}
                className={errors.scheduledAt ? 'border-destructive' : ''}
              />
              {errors.scheduledAt ? (
                <p className="text-sm text-destructive mt-1">{errors.scheduledAt}</p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Leave empty to save as draft
                </p>
              )}
            </div>
            <div>
              <Label>Target Groups (Optional)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-slate-900 border-slate-700 hover:bg-slate-800"
                  >
                    {formData.tagIds.length === 0
                      ? 'Select groups...'
                      : `${formData.tagIds.length} group${formData.tagIds.length > 1 ? 's' : ''} selected`}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {tags.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-slate-400">
                      No groups available
                    </div>
                  ) : (
                    tags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        checked={formData.tagIds.includes(tag.id)}
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="pl-2 pr-1 py-1"
                      style={{ borderColor: tag.color, borderWidth: 1 }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-1.5"
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
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Leave empty to send to all subscribed contacts
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create & Edit Campaign'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

