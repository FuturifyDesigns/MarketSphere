import { COMPANY, FAQ_CATEGORIES, FAQ_ITEMS, SERVICES } from './constants'
import type { CmsExtraSection, CmsStringItem } from './cmsTypes'

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

function stringsToItems(values: readonly string[]): CmsStringItem[] {
  return values.map((text, index) => ({ id: `str-${index + 1}`, text }))
}

export const DEFAULT_SITE_CONTENT: Record<SiteContentKey, unknown> = {
  company: {
    ...COMPANY,
    footer: {
      ctaEyebrow: 'Market Sphere Group',
      ctaTitle: COMPANY.tagline,
      ctaDesc: 'Connecting Botswana with verified professionals across every field.',
    },
    extraSections: [] as CmsExtraSection[],
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
    supportCta: {
      eyebrow: 'Support',
      title: "Can't find what you're looking for?",
      body: 'Our team is ready to help with any questions about services, providers, or your account.',
      primaryLabel: 'Contact Us',
      primaryHref: '/contact',
      secondaryLabel: 'Create Account',
      secondaryHref: '/register',
    },
    extraSections: [] as CmsExtraSection[],
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
      ctaBrowseHref: '/browse',
      ctaProvider: 'List Your Business',
      ctaProviderHref: '/register?role=provider',
      video: 'home/hero-video.mp4',
    },
    stats: [
      { id: 'stat-1', number: '8+', label: 'Service categories', description: 'From academic tuition to real estate consultancy' },
      { id: 'stat-2', number: 'SADC', label: 'Expansion ready', description: 'Built in Botswana, scaling across the region' },
      { id: 'stat-3', number: '100%', label: 'Verified network', description: 'Every provider reviewed by our team' },
    ] satisfies HomeStat[],
    marquee: stringsToItems([
      'Youth Empowerment',
      'Real Estate',
      'Academic Tuition',
      'Entrepreneurship',
      'Platform Marketing',
      'Botswana',
      'SADC',
      'Master Your Field',
    ]),
    providersSection: {
      eyebrow: 'Our Network',
      title: 'Featured providers',
      titleEmphasis: 'providers',
      lead: 'Browse verified professionals ready to help you master your field.',
      cta: 'Browse all providers',
      footer: 'Discover more categories, locations, and specialists on the full marketplace.',
      trustBadges: stringsToItems([
        'Verified listings',
        'Trusted across Botswana',
        'Growing provider network',
      ]),
    },
    vision: {
      eyebrow: 'Our Vision',
      title: COMPANY.mission,
      lead: COMPANY.vision,
    },
    testimonialsSection: {
      eyebrow: 'Client Stories',
      title: 'Satisfied clients',
      titleEmphasis: 'across Botswana',
    },
    servicesShowcase: {
      eyebrow: 'What We Offer',
      title: 'Services',
      taglineBefore: 'that empower',
      taglineEmphasis: 'the nation',
      ctaLabel: 'Learn more',
    },
    cta: {
      title: 'Ready to get started?',
      body: `Join ${COMPANY.shortName} — whether you're looking for services or offering them.`,
      primaryLabel: 'Create Account',
      primaryHref: '/register',
      secondaryLabel: 'Contact Us',
      secondaryHref: '/contact',
    },
    extraSections: [] as CmsExtraSection[],
  },
  contact: {
    hero: {
      eyebrow: 'Get in Touch',
      title: "Let's start a",
      titleEmphasis: 'conversation',
      lead: 'Whether you need a service, want to partner with us, or have a question — our team is ready to help you move forward.',
      responseTime: 'Within 1–2 business days',
      cardTitle: "We're here to help",
      cardBody: 'Reach out for enquiries, partnerships, or provider onboarding.',
      headOfficeLabel: 'Head office',
    },
    details: {
      sectionEyebrow: 'Reach Us',
      sectionTitle: 'Contact details',
      sectionLead: "Visit our office, send an email, or call — we'd love to hear from you.",
      emailLabel: 'Email us',
      emailHint: 'Best for detailed enquiries',
      phoneLabel: 'Call us',
      phoneHint: 'Mon–Fri, business hours',
      visitLabel: 'Visit us',
      registrationLabel: 'Registration',
      typeLabel: 'Type',
    },
    form: {
      eyebrow: 'Send a message',
      title: 'Tell us how we can help',
      submitLabel: 'Send Message',
      privacyNote:
        "By submitting this form you agree to our Privacy Policy. We process your details to respond to your enquiry in line with Botswana's Data Protection Act, 2024.",
      successTitle: 'Thank you!',
      successBody: "Your message has been noted. We'll get back to you within 1–2 business days.",
      successNote: 'For urgent enquiries, please call us directly.',
    },
    extraSections: [] as CmsExtraSection[],
  },
  about: {
    hero: {
      eyebrow: 'About Us',
      title: "Building Botswana's",
      titleEmphasis: 'service marketplace',
      lead: COMPANY.tagline,
    },
    tree: {
      introEyebrow: 'Our Story',
      introTitle: 'How we grow together',
      introLead: 'Scroll to grow each branch — every node opens fully before the next one appears.',
      rootTitle: COMPANY.shortName,
      rootSubtitle: COMPANY.name,
      rootBody: COMPANY.overview,
      missionLabel: 'Mission',
      mission: COMPANY.mission,
      visionLabel: 'Vision',
      vision: COMPANY.vision,
      valuesLabel: 'Core Values',
      valuesHeading: 'What we stand for',
      coreValues: stringsToItems([...COMPANY.coreValues]),
      areasLabel: 'Areas of Interest',
      areasHeading: 'What we do',
      areas: stringsToItems([...COMPANY.areasOfInterest]),
      detailsLabel: 'Company Details',
      detailsHeading: 'Get in touch',
      companyType: COMPANY.companyType,
      businessType: COMPANY.businessType,
    },
    staff: {
      eyebrow: 'Our Team',
      title: 'Leadership &',
      titleEmphasis: 'management',
      lead: 'The people guiding Market Sphere Group — connecting communities with trusted professionals across Botswana.',
      members: [
        {
          id: 'staff-samuel',
          name: 'Mr. Samuel Akinsola',
          role: 'Chief Executive Officer (CEO)',
          phone: '+267 74 013 060',
          image: 'staff/samuel-akinsola.png',
        },
        {
          id: 'staff-pearl',
          name: 'Ms. Pearl Lindiwe Phatsimo',
          role: 'Office Manager & Property Agency Personnel',
          phone: '+267 78 377 990',
          image: 'staff/pearl-phatsimo.png',
        },
        {
          id: 'staff-tumisang',
          name: 'Ms. Tumisang Gaobonya',
          role: 'Financial & Business Partnership Personnel',
          phone: '+267 77 414 473',
          image: 'staff/tumisang-gaobonya.png',
        },
      ],
    },
    extraSections: [] as CmsExtraSection[],
  },
  services: {
    hero: {
      eyebrow: 'Our Services',
      title: 'Professional solutions',
      titleEmphasis: 'across Botswana',
      lead: `From youth empowerment to real estate consultancy — ${COMPANY.shortName} delivers timely, professional services that meet the needs of clients and communities nationwide.`,
      hint: 'Scroll to explore each service line',
    },
    showcase: {
      eyebrow: 'What We Offer',
      title: 'Services built for',
      titleEmphasis: 'impact',
      lead: 'Scroll to explore how Market Sphere Group empowers communities across Botswana.',
      ctaLabel: 'Enquire now',
    },
    cta: {
      eyebrow: 'Get Started',
      title: 'Looking for a specific service?',
      body: `Browse our network of verified providers or list your own business with ${COMPANY.shortName}.`,
      primaryLabel: 'Browse Providers',
      primaryHref: '/browse',
      secondaryLabel: 'Become a Provider',
      secondaryHref: '/register?role=provider',
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
    extraSections: [] as CmsExtraSection[],
  },
}

export function cloneDefaults() {
  return structuredClone(DEFAULT_SITE_CONTENT) as Record<SiteContentKey, unknown>
}

/** Normalize legacy marquee string[] to CmsStringItem[] */
export function normalizeStringItems(value: unknown, fallback: CmsStringItem[]): CmsStringItem[] {
  if (!Array.isArray(value) || !value.length) return fallback
  if (typeof value[0] === 'string') {
    return (value as string[]).map((text, index) => ({ id: `str-${index + 1}`, text }))
  }
  return value as CmsStringItem[]
}
