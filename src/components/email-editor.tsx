'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Eye } from 'lucide-react'

interface EmailEditorProps {
  designJson?: any
  subject?: string
  onSubjectChange?: (subject: string) => void
  onSave?: (design: any, html: string) => void
  onPreview?: (html: string) => void
}

export function EmailEditor({
  designJson,
  subject = '',
  onSubjectChange,
  onSave,
  onPreview,
}: EmailEditorProps) {
  const editorRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [editorReady, setEditorReady] = useState(false)

  useEffect(() => {
    if (editorReady && window.unlayer && editorRef.current) {
      if (designJson) {
        editorRef.current.loadDesign(designJson)
      }
    }
  }, [editorReady, designJson])

  const initEditor = () => {
    if (!window.unlayer) return

    editorRef.current = window.unlayer.createEditor({
      id: 'email-editor',
      displayMode: 'email',
      appearance: {
        theme: 'dark',
      },
      features: {
        textEditor: {
          tables: true,
          cleanPaste: true,
        },
      },
      designTags: {
        business_name: 'Trems',
        business_email: 'info@trems.hr',
      },
      // Set default body/content width
      options: {
        bodyValues: {
          contentWidth: '100%',
          contentWidthMax: 700,
        },
      },
      // Default design settings for new emails
      designTagsConfig: {
        delimiter: ['{{', '}}'],
      },
    })

    // Set default body settings after editor loads
    editorRef.current.addEventListener('editor:ready', () => {
      editorRef.current.setBodyValues({
        contentWidth: '100%',
      })
    })

    setEditorReady(true)
    setLoading(false)
  }

  const handleSave = () => {
    if (!editorRef.current) return

    editorRef.current.exportHtml((data: any) => {
      const { design, html } = data
      onSave?.(design, html)
    })
  }

  const handlePreview = () => {
    if (!editorRef.current) return

    editorRef.current.exportHtml((data: any) => {
      const { html } = data
      onPreview?.(html)
    })
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <Script
        src="https://editor.unlayer.com/embed.js"
        onLoad={initEditor}
        strategy="lazyOnload"
      />
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => onSubjectChange?.(e.target.value)}
            placeholder="Email subject..."
            className="bg-slate-800 border-slate-700"
          />
        </div>
        <Button variant="outline" onClick={handlePreview} disabled={!editorReady}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button onClick={handleSave} disabled={!editorReady}>
          <Save className="mr-2 h-4 w-4" />
          Save Design
        </Button>
      </div>
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
            <p className="text-slate-400">Loading editor...</p>
          </div>
        )}
        <div id="email-editor" className="h-full w-full" />
      </div>
    </div>
  )
}

// Extend window type for Unlayer
declare global {
  interface Window {
    unlayer: {
      createEditor: (options: any) => any
    }
  }
}

