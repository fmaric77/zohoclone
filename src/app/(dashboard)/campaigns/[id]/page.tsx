'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Send, Trash2, Copy, RefreshCw, Play, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  htmlContent: string | null
  tags: Array<{ tag: { id: string; name: string; color: string } }>
  emailSends: Array<{
    id: string
    status: string
    sentAt: string | null
    contact: { email: string }
  }>
  _count: { emailSends: number }
  potentialRecipients: number
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [resendDialogOpen, setResendDialogOpen] = useState(false)
  const [resending, setResending] = useState(false)
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)
  const [resuming, setResuming] = useState(false)

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
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!campaign) return
    if (!confirm('Send this campaign to all selected recipients?')) return

    setSending(true)
    try {
      const response = await fetch(`/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.sent > 0) {
          toast.success(`Campaign sent! ${result.sent} emails sent successfully.`)
          if (result.failed > 0) {
            toast.warning(`${result.failed} emails failed to send`)
          }
        } else {
          // Show detailed error messages
          let errorMessage = result.message || 'No emails were sent.'
          if (result.errors && result.errors.length > 0) {
            errorMessage += ` Errors: ${result.errors.slice(0, 3).join('; ')}`
            if (result.errors.length > 3) {
              errorMessage += ` (and ${result.errors.length - 3} more)`
            }
          } else if (result.failed > 0) {
            errorMessage += ` ${result.failed} emails failed.`
          }
          toast.error(errorMessage, { duration: 10000 })
        }
        fetchCampaign(campaign.id)
      } else {
        const error = await response.json()
        toast.error(error.error || error.details || 'Failed to send campaign', { duration: 10000 })
        fetchCampaign(campaign.id)
      }
    } catch (error) {
      toast.error('Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (!campaign) return
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Campaign deleted successfully')
        router.push('/campaigns')
      } else {
        toast.error('Failed to delete campaign')
      }
    } catch (error) {
      toast.error('Failed to delete campaign')
    }
  }

  const handleDuplicate = async () => {
    if (!campaign) return

    setDuplicating(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        const newCampaign = await response.json()
        toast.success('Campaign duplicated successfully')
        router.push(`/campaigns/${newCampaign.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to duplicate campaign')
      }
    } catch (error) {
      toast.error('Failed to duplicate campaign')
    } finally {
      setDuplicating(false)
    }
  }

  const handleResume = async () => {
    if (!campaign) return

    setResuming(true)
    try {
      const response = await fetch(`/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignId: campaign.id,
          resume: true,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.sent > 0) {
          toast.success(`Resume complete! ${result.sent} more emails sent.`)
          if (result.failed > 0) {
            toast.warning(`${result.failed} emails failed to send`)
          }
        } else {
          toast.info('No remaining emails to send. Campaign marked as sent.')
        }
        setResumeDialogOpen(false)
        fetchCampaign(campaign.id)
      } else {
        const error = await response.json()
        toast.error(error.error || error.details || 'Failed to resume campaign', { duration: 10000 })
      }
    } catch (error) {
      toast.error('Failed to resume campaign')
    } finally {
      setResuming(false)
    }
  }

  const handleForceStatus = async (status: 'SENT' | 'DRAFT') => {
    if (!campaign) return

    setResuming(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, forceStatus: true }),
      })

      if (response.ok) {
        toast.success(`Campaign status updated to ${status}`)
        setResumeDialogOpen(false)
        fetchCampaign(campaign.id)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update campaign status')
      }
    } catch (error) {
      toast.error('Failed to update campaign status')
    } finally {
      setResuming(false)
    }
  }

  const handleResend = async (mode: 'new' | 'all') => {
    if (!campaign) return

    setResending(true)
    try {
      const response = await fetch(`/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignId: campaign.id,
          resend: true,
          resendMode: mode,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.sent === 0) {
          if (mode === 'new') {
            toast.info('No new contacts to send to')
          } else {
            // Show detailed error messages
            let errorMessage = result.message || 'No emails were sent.'
            if (result.errors && result.errors.length > 0) {
              errorMessage += ` Errors: ${result.errors.slice(0, 3).join('; ')}`
              if (result.errors.length > 3) {
                errorMessage += ` (and ${result.errors.length - 3} more)`
              }
            } else if (result.failed > 0) {
              errorMessage += ` ${result.failed} emails failed.`
            }
            toast.error(errorMessage, { duration: 10000 })
          }
        } else {
          toast.success(`Campaign resent! ${result.sent} emails sent successfully.`)
          if (result.failed > 0) {
            toast.warning(`${result.failed} emails failed to send`)
          }
        }
        setResendDialogOpen(false)
        fetchCampaign(campaign.id)
      } else {
        const error = await response.json()
        toast.error(error.error || error.details || 'Failed to resend campaign', { duration: 10000 })
        fetchCampaign(campaign.id)
      }
    } catch (error) {
      toast.error('Failed to resend campaign')
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-400 py-8">Loading...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-400 py-8">Campaign not found</div>
      </div>
    )
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">{campaign.name}</h1>
            <p className="text-slate-400 mt-2">{campaign.subject}</p>
          </div>
          <div className="flex gap-2">
            <Badge>{campaign.status}</Badge>
            <Link href={`/campaigns/${campaign.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDuplicate} disabled={duplicating}>
              <Copy className="mr-2 h-4 w-4" />
              {duplicating ? 'Duplicating...' : 'Duplicate'}
            </Button>
            {campaign.status === 'DRAFT' && (
              <Button onClick={handleSend} disabled={sending}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Sending...' : 'Send Now'}
              </Button>
            )}
            {campaign.status === 'SENDING' && (
              <Button 
                variant="default" 
                onClick={() => setResumeDialogOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Stuck - Fix
              </Button>
            )}
            {campaign.status === 'SENT' && (
              <Button 
                variant="outline" 
                onClick={() => setResendDialogOpen(true)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Campaign Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <Badge>{campaign.status}</Badge>
            </div>
            {campaign.scheduledAt && (
              <div>
                <p className="text-sm text-slate-400">Scheduled For</p>
                <p className="text-slate-100">
                  {new Date(campaign.scheduledAt).toLocaleString()}
                </p>
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <p className="text-sm text-slate-400">Sent At</p>
                <p className="text-slate-100">
                  {new Date(campaign.sentAt).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-400">
                {campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' 
                  ? 'Potential Recipients' 
                  : 'Recipients'}
              </p>
              {campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' ? (
                <p className="text-slate-100">
                  {campaign.potentialRecipients} contact{campaign.potentialRecipients !== 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-slate-100">
                  {campaign._count.emailSends} sent
                  {campaign.potentialRecipients > campaign._count.emailSends && (
                    <span className="text-slate-400 text-sm ml-1">
                      ({campaign.potentialRecipients - campaign._count.emailSends} new available)
                    </span>
                  )}
                </p>
              )}
            </div>
            {campaign.tags.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.tags.map(({ tag }) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{ borderColor: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.htmlContent ? (
              <div
                className="border border-slate-800 rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: campaign.htmlContent }}
              />
            ) : (
              <p className="text-slate-400 text-sm">No preview available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 md:col-span-2">
          <CardHeader>
            <CardTitle>Send History</CardTitle>
            <CardDescription>Recent email sends for this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {campaign.emailSends.length === 0 ? (
              <p className="text-slate-400 text-sm">No sends yet</p>
            ) : (
              <div className="space-y-2">
                {campaign.emailSends.map((send) => (
                  <div
                    key={send.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800"
                  >
                    <div>
                      <p className="font-medium text-slate-100">{send.contact.email}</p>
                      {send.sentAt && (
                        <p className="text-sm text-slate-400">
                          {new Date(send.sentAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Badge>{send.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resend Dialog */}
      <Dialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Campaign</DialogTitle>
            <DialogDescription>
              Choose how you want to resend this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              className="w-full justify-start h-auto py-4"
              variant="outline"
              onClick={() => handleResend('new')}
              disabled={resending}
            >
              <div className="text-left">
                <div className="font-semibold">Send to new contacts only</div>
                <div className="text-sm text-slate-400 font-normal">
                  Only contacts who haven't received this campaign yet
                </div>
              </div>
            </Button>
            <Button
              className="w-full justify-start h-auto py-4"
              variant="outline"
              onClick={() => handleResend('all')}
              disabled={resending}
            >
              <div className="text-left">
                <div className="font-semibold">Resend to all contacts</div>
                <div className="text-sm text-slate-400 font-normal">
                  Send again to everyone in the target groups
                </div>
              </div>
            </Button>
            {resending && (
              <p className="text-center text-sm text-slate-400">Sending...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Stuck Campaign Dialog */}
      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campaign Stuck in Sending</DialogTitle>
            <DialogDescription>
              This campaign appears to be stuck. This can happen due to server timeouts.
              Choose how to proceed:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              className="w-full justify-start h-auto py-4"
              variant="default"
              onClick={handleResume}
              disabled={resuming}
            >
              <Play className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Resume Sending</div>
                <div className="text-sm opacity-80 font-normal">
                  Continue sending to contacts who haven't received the email yet
                </div>
              </div>
            </Button>
            <Button
              className="w-full justify-start h-auto py-4"
              variant="outline"
              onClick={() => handleForceStatus('SENT')}
              disabled={resuming}
            >
              <div className="text-left">
                <div className="font-semibold">Mark as Sent</div>
                <div className="text-sm text-slate-400 font-normal">
                  Complete the campaign with current sends (skip remaining)
                </div>
              </div>
            </Button>
            <Button
              className="w-full justify-start h-auto py-4"
              variant="outline"
              onClick={() => handleForceStatus('DRAFT')}
              disabled={resuming}
            >
              <div className="text-left">
                <div className="font-semibold">Reset to Draft</div>
                <div className="text-sm text-slate-400 font-normal">
                  Put campaign back in draft state for editing
                </div>
              </div>
            </Button>
            {resuming && (
              <p className="text-center text-sm text-slate-400">Processing...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

