import { COMPANY, FAQ_CATEGORIES, FAQ_ITEMS, SERVICES } from './constants'

export const SITE_CONTENT_KEYS = {
  company: 'company',
  faq: 'faq',
  home: 'home',
  contact: 'contact',
  about: 'about',
  services: 'services',
} as const

export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[keyof typeof SITE_CONTENT_KEYS]

export type FaqItem = {
  id: string
  category: string
  question: string
  answer: string
}

export type HomeStat = {
  id: string
  number: string
  label: string
  description: string
}

export type MarketingService = {
  id: string
  title: string
  tagline: string
  description: string
  icon: string
  image: string
  video: string
  accent: string
  gradient: string
}

export const DEFAULT_SITE_CONTENT: Record<SiteContentKey, unknown> = {
  company: {
    ...COMPANY,
    footer: {
      ctaEyebrow: 'Market Sphere Group',
      ctaTitle: COMPANY.tagline,
      ctaDesc: 'Connecting Botswana with verified professionals across every field.',
    },
  },
  faq: {
    hero: {
      eyebrow: 'Help Centre',
      title: "Questions?\nWe've got answers",
      titleEmphasis: "We've got answers",
      lead: `Search or browse topics about ${COMPANY.shortName}, providers, and how our platform works.`,
      statAnswers: String(FAQ_ITEMS.length),
      statTopics: String(FAQ_CATEGORIES.length - 1),
      statSupport: '24h',
    },
    items: FAQ_ITEMS.map((item, index) => ({
      id: `faq-${index + 1}`,
      category: item.category,
      question: item.question,
      answer: item.answer,
    })),
    categories: [...FAQ_CATEGORIES],
  },
  home: {
    hero: {
      welcomeEyebrow: 'Welcome to',
      titleLine1: 'Connect with',
      titleLine2: 'trusted providers',
      titleLine3: 'across Botswana',
      subcopy:
        'A professional marketplace linking customers with verified service providers — from tutoring and real estate to youth empowerment and entrepreneurship.',
      ctaBrowse: 'Explore Providers',
      ctaProvider: 'List Your Business',
    },
    stats: [
      { id: 'stat-1', number: '8+', label: 'Service categories', description: 'From academic tuition to real estate consultancy' },
      { id: 'stat-2', number: 'SADC', label: 'Expansion ready', description: 'Built in Botswana, scaling across the region' },
      { id: 'stat-3', number: '100%', label: 'Verified network', description: 'Every provider reviewed by our team' },
    ] satisfies HomeStat[],
    marquee: [
      'Youth Empowerment',
      'Real Estate',
      'Academic Tuition',
      'Entrepreneurship',
      'Platform Marketing',
      'Botswana',
      'SADC',
      'Master Your Field',
    ],
    providersSection: {
      eyebrow: 'Our Network',
      title: 'Featured providers',
      titleEmphasis: 'providers',
      lead: 'Browse verified professionals ready to help you master your field.',
      cta: 'Browse all providers',
      footer: 'Discover more categories, locations, and specialists on the full marketplace.',
    },
    vision: {
      eyebrow: 'Our Vision',
      title: COMPANY.mission,
      lead: COMPANY.vision,
    },
  },
  contact: {
    hero: {
      eyebrow: 'Get in Touch',
      title: "Let's start a",
      titleEmphasis: 'conversation',
      lead: 'Whether you need a service, want to partner with us, or have a question — our team is ready to help you move forward.',
      responseTime: 'Within 1–2 business days',
    },
  },
  about: {
    hero: {
      eyebrow: 'About Us',
      title: "Building Botswana's",
      titleEmphasis: 'service marketplace',
      lead: COMPANY.tagline,
    },
  },
  services: {
    hero: {
      eyebrow: 'Our Services',
      title: 'Professional solutions',
      titleEmphasis: 'across Botswana',
      lead: `From youth empowerment to real estate consultancy — ${COMPANY.shortName} delivers timely, professional services that meet the needs of clients and communities nationwide.`,
      hint: 'Scroll to explore each service line',
    },
    items: SERVICES.map((service, index) => ({
      id: `service-${index + 1}`,
      title: service.title,
      tagline: service.tagline,
      description: service.description,
      icon: service.icon,
      image: service.image,
      video: service.video,
      accent: service.accent,
      gradient: service.gradient,
    })) satisfies MarketingService[],
  },
}

export function cloneDefaults() {
  return structuredClone(DEFAULT_SITE_CONTENT) as Record<SiteContentKey, unknown>
}
