import type { ShowcaseDealType } from './types'

export const SHOWCASE_DEAL_LABELS: Record<ShowcaseDealType, string> = {
  sale: 'For sale',
  rent: 'For rent',
  opportunity: 'Opportunity',
  project: 'Project',
  service: 'Service',
  other: 'Listing',
}

/** Positive / negative availability wording based on deal type. */
export const SHOWCASE_AVAILABILITY_LABELS: Record<
  ShowcaseDealType,
  { available: string; unavailable: string }
> = {
  sale: { available: 'Available', unavailable: 'Sold' },
  rent: { available: 'Available', unavailable: 'Rented' },
  opportunity: { available: 'Open', unavailable: 'Closed' },
  project: { available: 'Open', unavailable: 'Completed' },
  service: { available: 'Available', unavailable: 'Unavailable' },
  other: { available: 'Available', unavailable: 'Unavailable' },
}

export function showcaseAvailabilityLabel(dealType: ShowcaseDealType, available: boolean) {
  const labels = SHOWCASE_AVAILABILITY_LABELS[dealType] || SHOWCASE_AVAILABILITY_LABELS.other
  return available ? labels.available : labels.unavailable
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
