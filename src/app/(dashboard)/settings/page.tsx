'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    sesFromEmail: '',
    appUrl: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save settings')
      }
    } catch (error) {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-400 py-8">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-2">Configure your email campaign platform</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Configure your email sending settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sesFromEmail">SES From Email</Label>
              <Input
                id="sesFromEmail"
                value={settings.sesFromEmail}
                onChange={(e) =>
                  setSettings({ ...settings, sesFromEmail: e.target.value })
                }
                placeholder="campaigns@yourdomain.com"
              />
              <p className="text-xs text-slate-400 mt-1">
                This email must be verified in Amazon SES
              </p>
            </div>
            <div>
              <Label htmlFor="appUrl">Application URL</Label>
              <Input
                id="appUrl"
                value={settings.appUrl}
                onChange={(e) =>
                  setSettings({ ...settings, appUrl: e.target.value })
                }
                placeholder="https://yourdomain.com"
              />
              <p className="text-xs text-slate-400 mt-1">
                Used for tracking links and unsubscribe URLs
              </p>
            </div>
            <div className="p-3 rounded bg-amber-900/20 border border-amber-700/50">
              <p className="text-sm text-amber-300">
                ⚠️ <strong>Note:</strong> Settings are managed via environment variables in Vercel.
                Changes here are for reference only. To update settings, configure environment variables in your Vercel project settings.
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-400">
                Settings displayed (managed via environment variables)
              </p>
            )}
            <Button onClick={handleSave} disabled={saving || loading} variant="outline">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings (Read-only)'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Required environment variables for this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="p-3 rounded bg-slate-800">
                <code className="text-amber-400">DATABASE_URL</code>
                <p className="text-slate-400 text-xs mt-1">
                  PostgreSQL connection string
                </p>
              </div>
              <div className="p-3 rounded bg-slate-800">
                <code className="text-amber-400">AWS_ACCESS_KEY_ID</code>
                <p className="text-slate-400 text-xs mt-1">
                  AWS access key for SES
                </p>
              </div>
              <div className="p-3 rounded bg-slate-800">
                <code className="text-amber-400">AWS_SECRET_ACCESS_KEY</code>
                <p className="text-slate-400 text-xs mt-1">
                  AWS secret key for SES
                </p>
              </div>
              <div className="p-3 rounded bg-slate-800">
                <code className="text-amber-400">AWS_REGION</code>
                <p className="text-slate-400 text-xs mt-1">
                  AWS region (e.g., us-east-1)
                </p>
              </div>
              <div className="p-3 rounded bg-slate-800">
                <code className="text-amber-400">SES_FROM_EMAIL</code>
                <p className="text-slate-400 text-xs mt-1">
                  Default from email address
                </p>
              </div>
              <div className="p-3 rounded bg-slate-800">
                <code className="text-amber-400">APP_SECRET</code>
                <p className="text-slate-400 text-xs mt-1">
                  Secret for JWT tokens (32+ characters)
                </p>
              </div>
              <div className="p-3 rounded bg-slate-800">
                <code className="text-amber-400">ADMIN_PASSWORD_HASH</code>
                <p className="text-slate-400 text-xs mt-1">
                  bcrypt hash of admin password
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

