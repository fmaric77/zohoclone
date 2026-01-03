'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function UnsubscribePage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [contact, setContact] = useState<any>(null)
  const [feedback, setFeedback] = useState('')

  // Handle catch-all route - token can be string or string[]
  // We only need the first segment (the actual token)
  const getToken = () => {
    if (!params.token) return null
    if (Array.isArray(params.token)) return params.token[0]
    return params.token
  }

  const token = getToken()

  useEffect(() => {
    if (token) {
      fetchContact(token)
    }
  }, [token])

  const fetchContact = async (token: string) => {
    try {
      const response = await fetch(`/api/unsubscribe/${token}`)
      if (response.ok) {
        const data = await response.json()
        setContact(data.contact)
      }
    } catch (error) {
      console.error('Error fetching contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch(`/api/unsubscribe/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        toast.error('Failed to unsubscribe')
      }
    } catch (error) {
      toast.error('Failed to unsubscribe')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Unsubscribed</CardTitle>
            <CardDescription>
              You have been successfully unsubscribed from our emails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm">
              You will no longer receive emails from us. We're sorry to see you go!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Invalid Link</CardTitle>
            <CardDescription>
              This unsubscribe link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Unsubscribe</CardTitle>
          <CardDescription>
            We're sorry to see you go. You can unsubscribe from our emails below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">
              Email: <span className="text-slate-100">{contact.email}</span>
            </p>
          </div>
          <div>
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us why you're unsubscribing..."
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <Button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="w-full"
            variant="destructive"
          >
            {loading ? 'Unsubscribing...' : 'Unsubscribe'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

