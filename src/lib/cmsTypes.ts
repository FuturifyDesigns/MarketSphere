import type { SiteContentKey } from './siteContentDefaults'

export type CmsExtraSection = {
  id: string
  type: 'content' | 'cta' | 'banner'
  eyebrow?: string
  title?: string
  body?: string
  image?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
}

export type CmsStringItem = {
  id: string
  text: string
}

export function createExtraSection(type: CmsExtraSection['type'] = 'content'): CmsExtraSection {
  return {
    id: `section-${crypto.randomUUID()}`,
    type,
    eyebrow: 'New section',
    title: 'Section title',
    body: 'Add your content here.',
    image: '',
    primaryCtaLabel: 'Learn more',
    primaryCtaHref: '/contact',
    secondaryCtaLabel: '',
    secondaryCtaHref: '',
  }
}

export function createStringItem(text = 'New item'): CmsStringItem {
  return { id: `item-${crypto.randomUUID()}`, text }
}

export function createMarketingService(): import('./siteContentDefaults').MarketingService {
  return {
    id: `service-${crypto.randomUUID()}`,
    title: 'New Service',
    tagline: 'Service tagline',
    description: 'Describe this service and how it helps clients.',
    icon: 'sparkles',
    image: '/images/services/youth.jpg',
    video: '',
    accent: '#c9a227',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  }
}

export function createHomeStat(): import('./siteContentDefaults').HomeStat {
  return {
    id: `stat-${crypto.randomUUID()}`,
    number: '0',
    label: 'New stat',
    description: 'Add a short description.',
  }
}

export const PAGE_CONTENT_KEYS: SiteContentKey[] = [
  'home',
  'about',
  'services',
  'contact',
  'faq',
  'company',
]
