import type {
  ShowcaseAnnouncement,
  ShowcaseAnnouncementCategory,
  ShowcaseAvailabilityStatus,
  ShowcaseDealType,
  ShowcaseListing,
} from './types'

export const SHOWCASE_DEAL_LABELS: Record<ShowcaseDealType, string> = {
  sale: 'For sale',
  rent: 'For rent',
  sale_rent: 'For sale & rent',
  opportunity: 'Opportunity',
  project: 'Project',
  service: 'Service',
  other: 'Listing',
}

export const SHOWCASE_AVAILABILITY_STATUS_LABELS: Record<ShowcaseAvailabilityStatus, string> = {
  available: 'Available',
  sold: 'Sold',
  tenanted: 'Tenanted',
  closed: 'Closed',
  completed: 'Completed',
  unavailable: 'Unavailable',
}

/** Which availability choices admins get for a deal type. */
export function showcaseAvailabilityOptions(dealType: ShowcaseDealType): ShowcaseAvailabilityStatus[] {
  if (dealType === 'sale' || dealType === 'rent' || dealType === 'sale_rent') {
    return ['available', 'sold', 'tenanted']
  }
  if (dealType === 'opportunity') return ['available', 'closed']
  if (dealType === 'project') return ['available', 'completed']
  return ['available', 'unavailable']
}

export function resolveShowcaseAvailabilityStatus(listing: {
  availability_status?: string | null
  available?: boolean | null
  deal_type?: ShowcaseDealType | string | null
}): ShowcaseAvailabilityStatus {
  const raw = listing.availability_status?.trim()
  if (raw && raw in SHOWCASE_AVAILABILITY_STATUS_LABELS) {
    return raw as ShowcaseAvailabilityStatus
  }
  if (listing.available === false) {
    const dealType = listing.deal_type
    if (dealType === 'sale') return 'sold'
    if (dealType === 'rent' || dealType === 'sale_rent') return 'tenanted'
    if (dealType === 'opportunity') return 'closed'
    if (dealType === 'project') return 'completed'
    return 'unavailable'
  }
  return 'available'
}

export function showcaseAvailabilityLabel(
  listingOrDealType:
    | ShowcaseDealType
    | {
        availability_status?: string | null
        available?: boolean | null
        deal_type?: ShowcaseDealType | string | null
      },
  available?: boolean,
) {
  if (typeof listingOrDealType === 'object') {
    const status = resolveShowcaseAvailabilityStatus(listingOrDealType)
    const dealType = listingOrDealType.deal_type
    if (status === 'available' && (dealType === 'opportunity' || dealType === 'project')) {
      return 'Open'
    }
    return SHOWCASE_AVAILABILITY_STATUS_LABELS[status]
  }
  return showcaseAvailabilityLabel({
    deal_type: listingOrDealType,
    available: available !== false,
  })
}

export function showcaseIsClosed(listing: {
  availability_status?: string | null
  available?: boolean | null
  deal_type?: ShowcaseDealType | string | null
}) {
  return resolveShowcaseAvailabilityStatus(listing) !== 'available'
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
  | 'availability_status'
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
  const availability = showcaseAvailabilityLabel(listing)
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

export const SHOWCASE_ANNOUNCEMENT_CATEGORY_LABELS: Record<ShowcaseAnnouncementCategory, string> = {
  job: 'Job Opening',
  advertisement: 'Advertisement',
  event: 'Event',
  notice: 'Notice',
  general: 'Announcement',
}

export interface ShowcaseAnnouncementAction {
  url: string
  label: string
}

export function normalizeShowcaseUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const withoutTrailingPunctuation = trimmed.replace(/[.,;:!?)\]]+$/g, '')
  const candidate = /^(?:https?:\/\/)/i.test(withoutTrailingPunctuation)
    ? withoutTrailingPunctuation
    : /^(?:www\.)/i.test(withoutTrailingPunctuation) ||
        /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(withoutTrailingPunctuation)
      ? `https://${withoutTrailingPunctuation}`
      : null

  if (!candidate) return null
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function announcementUrlLabel(url: string) {
  try {
    return `Open ${new URL(url).hostname.replace(/^www\./i, '')}`
  } catch {
    return 'Open link'
  }
}

export function showcaseAnnouncementActions(
  announcement: ShowcaseAnnouncement,
): ShowcaseAnnouncementAction[] {
  const actions: ShowcaseAnnouncementAction[] = []
  const seen = new Set<string>()
  const add = (url: string | null, label?: string | null) => {
    if (!url || seen.has(url)) return
    seen.add(url)
    actions.push({
      url,
      label:
        label?.trim() ||
        (actions.length === 0
          ? announcement.category === 'job'
            ? 'Apply now'
            : 'Visit website'
          : announcementUrlLabel(url)),
    })
  }

  const directUrl = normalizeShowcaseUrl(announcement.link_url)
  const labelUrl = normalizeShowcaseUrl(announcement.link_label)
  const textLabel = announcement.link_label && !labelUrl ? announcement.link_label : null
  add(directUrl || labelUrl, textLabel)

  const bodyUrls = announcement.body.match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) || []
  for (const bodyUrl of bodyUrls) {
    const normalized = normalizeShowcaseUrl(bodyUrl)
    add(normalized, normalized ? announcementUrlLabel(normalized) : null)
  }

  return actions
}

export function isAnnouncementActive(announcement: ShowcaseAnnouncement): boolean {
  if (!announcement.active) return false
  const now = new Date().getTime()
  if (announcement.starts_at && new Date(announcement.starts_at).getTime() > now) return false
  if (announcement.expires_at && new Date(announcement.expires_at).getTime() <= now) return false
  return true
}

export function announcementWhatsAppLink(phone: string, announcement: ShowcaseAnnouncement) {
  const digits = phone.replace(/\D/g, '')
  const text = encodeURIComponent(
    `Hello, I am enquiring about the announcement "${announcement.title}" on Market Sphere Group.\n${typeof window !== 'undefined' ? window.location.href : ''}`,
  )
  return `https://wa.me/${digits}?text=${text}`
}

export function announcementMailto(email: string, announcement: ShowcaseAnnouncement) {
  const subject = encodeURIComponent(`Enquiry: ${announcement.title}`)
  const body = encodeURIComponent(
    `Hello,\n\nI am contacting you regarding the announcement "${announcement.title}" on Market Sphere Group.\n\n${typeof window !== 'undefined' ? window.location.href : ''}\n\nPlease share more information.\n\nThank you.`,
  )
  return `mailto:${email.trim()}?subject=${subject}&body=${body}`
}
