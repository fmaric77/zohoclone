import { NextResponse } from 'next/server'

interface Settings {
  sesFromEmail: string
  appUrl: string
}

async function getSettings(): Promise<Settings> {
  // In Vercel/serverless, we use environment variables
  // Filesystem is read-only except for /tmp
  return {
    sesFromEmail: process.env.SES_FROM_EMAIL || process.env.NEXT_PUBLIC_SES_FROM_EMAIL || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  // In Vercel/serverless, we can't write to filesystem
  // Settings are managed via environment variables in Vercel dashboard
  // This function is kept for API compatibility but doesn't persist
  // Users should set environment variables in Vercel dashboard
  console.log('Settings save requested (using env vars):', settings)
  // Note: In production, you could store these in a database table
}

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error loading settings:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sesFromEmail, appUrl } = body

    if (!sesFromEmail || !appUrl) {
      return NextResponse.json(
        { error: 'Both sesFromEmail and appUrl are required' },
        { status: 400 }
      )
    }

    const settings: Settings = {
      sesFromEmail: sesFromEmail.trim(),
      appUrl: appUrl.trim(),
    }

    await saveSettings(settings)

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

