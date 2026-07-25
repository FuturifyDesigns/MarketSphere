import type { ShowcaseDealType } from './types'

export const SHOWCASE_DEAL_LABELS: Record<ShowcaseDealType, string> = {
  sale: 'For sale',
  rent: 'For rent',
  opportunity: 'Opportunity',
  project: 'Project',
  service: 'Service',
  other: 'Listing',
}

export function showcaseContactMailto(title: string, columnTitle?: string) {
  const subject = encodeURIComponent(
    columnTitle ? `Showcase enquiry: ${title} (${columnTitle})` : `Showcase enquiry: ${title}`,
  )
  const body = encodeURIComponent(
    `Hello Market Sphere Group,\n\nI am interested in this showcase listing:\n${title}\n\nPlease contact me with more details.\n`,
  )
  return `mailto:info@marketspheregroup.com?subject=${subject}&body=${body}`
}

export function showcaseWhatsAppLink(phone: string, title: string) {
  const digits = phone.replace(/\D/g, '')
  const text = encodeURIComponent(`Hello Market Sphere, I am interested in: ${title}`)
  return `https://wa.me/${digits}?text=${text}`
}
