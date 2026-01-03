'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Save, Trash2, Plus, X, ChevronDown } from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
}

interface Contact {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'BOUNCED'
  subscribedAt: string
  unsubscribedAt: string | null
  customFields: Record<string, any>
  tags: Array<{ tag: { id: string; name: string; color: string } }>
  emailSends: Array<{
    id: string
    status: string
    sentAt: string | null
    campaign: { name: string }
  }>
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [contactTagIds, setContactTagIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    status: 'SUBSCRIBED' as 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'BOUNCED',
  })

  useEffect(() => {
    fetchAllTags()
    if (params.id) {
      fetchContact(params.id as string)
    }
  }, [params.id])

  const fetchAllTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setAllTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const fetchContact = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/contacts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setContact(data)
        setFormData({
          email: data.email,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          status: data.status,
        })
        // Set current tags
        if (data.tags) {
          setContactTagIds(data.tags.map((t: any) => t.tag?.id || t.tagId))
        }
      }
    } catch (error) {
      console.error('Error fetching contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTag = async (tagId: string) => {
    if (!contact) return
    
    const isAdding = !contactTagIds.includes(tagId)
    const newTagIds = isAdding
      ? [...contactTagIds, tagId]
      : contactTagIds.filter(id => id !== tagId)
    
    // Optimistic update
    setContactTagIds(newTagIds)
    
    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isAdding ? 'tag' : 'untag',
          contactIds: [contact.id],
          tagId,
        }),
      })

      if (response.ok) {
        // Refresh contact to get updated tags
        fetchContact(contact.id)
      } else {
        // Revert on failure
        setContactTagIds(contactTagIds)
        toast.error('Failed to update tag')
      }
    } catch (error) {
      setContactTagIds(contactTagIds)
      toast.error('Failed to update tag')
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!contact) return
    
    const newTagIds = contactTagIds.filter(id => id !== tagId)
    setContactTagIds(newTagIds)
    
    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'untag',
          contactIds: [contact.id],
          tagId,
        }),
      })

      if (!response.ok) {
        setContactTagIds(contactTagIds)
        toast.error('Failed to remove tag')
      } else {
        fetchContact(contact.id)
      }
    } catch (error) {
      setContactTagIds(contactTagIds)
      toast.error('Failed to remove tag')
    }
  }

  const selectedTags = allTags.filter(tag => contactTagIds.includes(tag.id))

  const handleSave = async () => {
    if (!contact) return
    setSaving(true)
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Contact updated successfully!')
        fetchContact(contact.id)
      } else {
        toast.error('Failed to update contact')
      }
    } catch (error) {
      toast.error('Failed to update contact')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!contact) return
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Contact deleted successfully')
        router.push('/contacts')
      } else {
        toast.error('Failed to delete contact')
      }
    } catch (error) {
      toast.error('Failed to delete contact')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-400 py-8">Loading...</div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-400 py-8">Contact not found</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/contacts')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
        <h1 className="text-3xl font-bold text-slate-100">Contact Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Update contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBSCRIBED">Subscribed</SelectItem>
                  <SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
                  <SelectItem value="BOUNCED">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Assign contact to groups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add to group
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {allTags.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-slate-400">
                    No tags available. Create one first.
                  </div>
                ) : (
                  allTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={contactTagIds.includes(tag.id)}
                      onCheckedChange={() => handleToggleTag(tag.id)}
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
            
            <div className="flex flex-wrap gap-2">
              {selectedTags.length === 0 ? (
                <p className="text-slate-400 text-sm">Not assigned to any groups</p>
              ) : (
                selectedTags.map((tag) => (
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
                      onClick={() => handleRemoveTag(tag.id)}
                      className="ml-1 hover:bg-slate-600 rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 md:col-span-2">
          <CardHeader>
            <CardTitle>Email History</CardTitle>
            <CardDescription>Recent email sends to this contact</CardDescription>
          </CardHeader>
          <CardContent>
            {contact.emailSends.length === 0 ? (
              <p className="text-slate-400 text-sm">No emails sent</p>
            ) : (
              <div className="space-y-2">
                {contact.emailSends.map((send) => (
                  <div
                    key={send.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800"
                  >
                    <div>
                      <p className="font-medium text-slate-100">
                        {send.campaign.name}
                      </p>
                      <p className="text-sm text-slate-400">
                        {send.sentAt
                          ? new Date(send.sentAt).toLocaleString()
                          : 'Not sent'}
                      </p>
                    </div>
                    <Badge>{send.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

