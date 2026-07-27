import type { ShowcaseDealType, ShowcaseListing } from './types'

export const SHOWCASE_DEAL_LABELS: Record<ShowcaseDealType, string> = {
  sale: 'For sale',
  rent: 'For rent',
  sale_rent: 'For sale & rent',
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
  sale_rent: { available: 'Available', unavailable: 'Unavailable' },
  opportunity: { available: 'Open', unavailable: 'Closed' },
  project: { available: 'Open', unavailable: 'Completed' },
  service: { available: 'Available', unavailable: 'Unavailable' },
  other: { available: 'Available', unavailable: 'Unavailable' },
}

export function showcaseAvailabilityLabel(dealType: ShowcaseDealType, available: boolean) {
  const labels = SHOWCASE_AVAILABILITY_LABELS[dealType] || SHOWCASE_AVAILABILITY_LABELS.other
  return available ? labels.available : labels.unavailable
}

export function showcaseHasOwnerContacts(listing: {
  owner_name?: string | null
  owner_phone?: string | null
  owner_email?: string | null
}) {
  return Boolean(listing.owner_name?.trim() || listing.owner_phone?.trim() || listing.owner_email?.trim())
}

export type ShowcaseEnquiryListing = Pick<
  ShowcaseListing,
  | 'id'
  | 'title'
  | 'summary'
  | 'description'
  | 'location'
  | 'price_label'
  | 'deal_type'
  | 'available'
> & {
  columnTitle?: string | null
  columnSlug?: string | null
  listingUrl?: string | null
}

function trimBlock(value: string | null | undefined) {
  return value?.trim() || ''
}

function truncateText(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

/** Build a predefined enquiry message with the selected listing's details. */
export function showcaseListingEnquiryMessage(
  listing: ShowcaseEnquiryListing,
  options?: { greeting?: string; maxDescriptionChars?: number },
) {
  const greeting = options?.greeting ?? 'Hello Market Sphere Group,'
  const deal =
    listing.deal_type in SHOWCASE_DEAL_LABELS
      ? SHOWCASE_DEAL_LABELS[listing.deal_type]
      : SHOWCASE_DEAL_LABELS.other
  const availability = showcaseAvailabilityLabel(listing.deal_type, listing.available !== false)
  const summary = trimBlock(listing.summary)
  const descriptionRaw = trimBlock(listing.description)
  const description = options?.maxDescriptionChars
    ? truncateText(descriptionRaw, options.maxDescriptionChars)
    : descriptionRaw
  const location = trimBlock(listing.location)
  const price = trimBlock(listing.price_label)
  const columnTitle = trimBlock(listing.columnTitle)
  const listingUrl =
    trimBlock(listing.listingUrl) ||
    (listing.columnSlug && listing.id
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/showcase/${listing.columnSlug}/${listing.id}`
      : '')

  const lines = [
    greeting,
    '',
    'I am interested in this showcase listing:',
    '',
    `Title: ${listing.title}`,
  ]

  if (columnTitle) lines.push(`Column: ${columnTitle}`)
  lines.push(`Deal type: ${deal}`)
  lines.push(`Availability: ${availability}`)
  if (location) lines.push(`Location: ${location}`)
  if (price) lines.push(`Price: ${price}`)
  if (listingUrl) lines.push(`Listing link: ${listingUrl}`)

  if (summary) {
    lines.push('', 'Summary:', summary)
  }
  if (description) {
    lines.push('', 'Full description:', description)
  }

  lines.push('', 'Please contact me with more details.', '')
  return lines.join('\n')
}

export function showcaseOwnerMailto(email: string, listing: ShowcaseEnquiryListing) {
  const subject = encodeURIComponent(`Enquiry about: ${listing.title}`)
  const body = encodeURIComponent(
    showcaseListingEnquiryMessage(listing, { greeting: 'Hello,' }),
  )
  return `mailto:${email.trim()}?subject=${subject}&body=${body}`
}

export function showcaseOwnerWhatsApp(phone: string, listing: ShowcaseEnquiryListing) {
  const digits = phone.replace(/\D/g, '')
  const text = encodeURIComponent(
    showcaseListingEnquiryMessage(listing, {
      greeting: 'Hello,',
      maxDescriptionChars: 900,
    }),
  )
  return `https://wa.me/${digits}?text=${text}`
}

export function showcaseOwnerTel(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return `tel:${digits}`
}

export function showcaseContactMailto(listing: ShowcaseEnquiryListing) {
  const columnTitle = trimBlock(listing.columnTitle)
  const subject = encodeURIComponent(
    columnTitle ? `Showcase enquiry: ${listing.title} (${columnTitle})` : `Showcase enquiry: ${listing.title}`,
  )
  const body = encodeURIComponent(showcaseListingEnquiryMessage(listing))
  return `mailto:info@marketspheregroup.com?subject=${subject}&body=${body}`
}

export function showcaseWhatsAppLink(phone: string, listing: ShowcaseEnquiryListing) {
  const digits = phone.replace(/\D/g, '')
  const text = encodeURIComponent(
    showcaseListingEnquiryMessage(listing, {
      greeting: 'Hello Market Sphere,',
      maxDescriptionChars: 900,
    }),
  )
  return `https://wa.me/${digits}?text=${text}`
}
