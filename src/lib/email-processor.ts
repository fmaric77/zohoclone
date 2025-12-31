import { Contact } from '@prisma/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export function processMergeTags(html: string, contact: Contact): string {
  let processed = html

  // Replace merge tags
  processed = processed.replace(/\{\{email\}\}/gi, contact.email)
  processed = processed.replace(/\{\{firstName\}\}/gi, contact.firstName || '')
  processed = processed.replace(/\{\{lastName\}\}/gi, contact.lastName || '')
  processed = processed.replace(/\{\{fullName\}\}/gi, 
    `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email
  )

  // Replace custom fields
  if (contact.customFields && typeof contact.customFields === 'object') {
    Object.keys(contact.customFields).forEach((key) => {
      const value = (contact.customFields as any)[key]
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi')
      processed = processed.replace(regex, String(value || ''))
    })
  }

  return processed
}

export function injectTrackingPixel(html: string, sendId: string): string {
  const pixelUrl = `${APP_URL}/api/track/open/${sendId}`
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`
  
  // Inject before closing body tag, or at the end if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`)
  }
  return html + pixel
}

export function injectClickTracking(html: string, sendId: string): string {
  // Find all links (href="...")
  const linkRegex = /<a\s+([^>]*\s+)?href=["']([^"']+)["']([^>]*)>/gi
  
  return html.replace(linkRegex, (match, before, url, after) => {
    // Skip if already a tracking link or mailto/tel links
    if (url.startsWith('mailto:') || url.startsWith('tel:') || url.includes('/api/track/click/')) {
      return match
    }

    // Create tracking URL
    const trackingUrl = `${APP_URL}/api/track/click/${sendId}?url=${encodeURIComponent(url)}`
    
    return `<a ${before || ''}href="${trackingUrl}"${after || ''}>`
  })
}

export function injectUnsubscribeLink(html: string, contactId: string, token: string): string {
  const unsubscribeUrl = `${APP_URL}/unsubscribe/${token}`
  const unsubscribeLink = `<p style="font-size:12px;color:#999;text-align:center;margin-top:20px;">
    <a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe</a>
  </p>`

  // Inject before closing body tag, or at the end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeLink}</body>`)
  }
  return html + unsubscribeLink
}

export function processEmailContent(
  html: string,
  contact: Contact,
  sendId: string,
  unsubscribeToken: string
): string {
  let processed = html

  // Apply merge tags
  processed = processMergeTags(processed, contact)

  // Inject tracking
  processed = injectTrackingPixel(processed, sendId)
  processed = injectClickTracking(processed, sendId)
  processed = injectUnsubscribeLink(processed, contact.id, unsubscribeToken)

  return processed
}

