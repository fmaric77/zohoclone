import { NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const SETTINGS_FILE = join(process.cwd(), 'settings.json')

interface Settings {
  sesFromEmail: string
  appUrl: string
}

async function getSettings(): Promise<Settings> {
  try {
    const data = await readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // Return defaults if file doesn't exist
    return {
      sesFromEmail: process.env.SES_FROM_EMAIL || process.env.NEXT_PUBLIC_SES_FROM_EMAIL || '',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    }
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
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

