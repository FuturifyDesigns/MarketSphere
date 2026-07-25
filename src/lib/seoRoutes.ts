/**
 * Single source of truth for per-route SEO metadata.
 *
 * Imported by DocumentSeo at runtime and by the Vite prerender plugin at build
 * time, so the static HTML shipped for each route matches what the app renders.
 * Keep this module free of browser-only APIs — it runs in Node during builds.
 */

export interface RouteSeo {
  path: string
  title: string
  description: string
  /** Non-indexable routes still need a static file so deep links return 200. */
  indexable: boolean
}

export const SITE_ORIGIN = 'https://marketspheregroup.com'

export const DEFAULT_SEO = {
  title: 'Market Sphere Group — Verified Service Providers in Botswana',
  description:
    'Market Sphere Group connects customers with verified service providers across Botswana — tutoring, real estate, youth empowerment, marketing, and more.',
}

/** Showcase columns seeded in Supabase, used for prerendered field pages. */
export const SHOWCASE_COLUMNS: { slug: string; title: string; description: string }[] = [
  {
    slug: 'real-estate',
    title: 'Real Estate in Botswana',
    description:
      'Homes, plots and commercial spaces for sale and rent across Botswana, placed by Market Sphere Group.',
  },
  {
    slug: 'youth-empowerment',
    title: 'Youth Empowerment Programmes',
    description:
      'Youth empowerment projects, mentorship and opportunities for young people across Botswana.',
  },
  {
    slug: 'farming',
    title: 'Farming Practices & Produce',
    description:
      'Agricultural opportunities, produce and farming practice listings from across Botswana.',
  },
  {
    slug: 'entrepreneurship',
    title: 'Entrepreneurship Support',
    description:
      'Business development, funding readiness and entrepreneurship support for Botswana founders.',
  },
  {
    slug: 'academic-tuition',
    title: 'Academic Tuition',
    description:
      'Qualified tutors and academic support programmes for learners and students in Botswana.',
  },
  {
    slug: 'platform-marketing',
    title: 'Platform Marketing',
    description:
      'Digital and platform marketing services helping Botswana businesses reach the right customers.',
  },
  {
    slug: 'music-education',
    title: 'Music Education',
    description: 'Music tuition, training and performance development opportunities in Botswana.',
  },
  {
    slug: 'career-development',
    title: 'Career Development',
    description:
      'Career guidance, skills development and professional growth opportunities across Botswana.',
  },
  {
    slug: 'it-services',
    title: 'IT Services',
    description:
      'Technology, software and IT support services for businesses and individuals in Botswana.',
  },
]

const CONTENT_ROUTES: RouteSeo[] = [
  { path: '/', ...DEFAULT_SEO, indexable: true },
  {
    path: '/about',
    title: 'About Market Sphere Group | Botswana Marketplace',
    description:
      'Learn about Market Sphere Group (Pty) Ltd — our mission, values, and how we connect customers with verified service providers across Botswana.',
    indexable: true,
  },
  {
    path: '/services',
    title: 'Our Services | Market Sphere Group',
    description:
      'Explore Market Sphere Group services: academic tuition, real estate, youth empowerment, entrepreneurship, and platform marketing across Botswana.',
    indexable: true,
  },
  {
    path: '/showcase',
    title: 'Showcase | Market Sphere Group',
    description:
      'Browse Market Sphere Group showcase listings — properties for sale and rent, youth projects, farming, entrepreneurship, and more across Botswana.',
    indexable: true,
  },
  {
    path: '/browse',
    title: 'Browse Providers | Market Sphere Group',
    description:
      'Browse verified service providers across Botswana. Filter by category and connect with trusted professionals on Market Sphere Group.',
    indexable: true,
  },
  {
    path: '/contact',
    title: 'Contact Us | Market Sphere Group',
    description:
      'Get in touch with Market Sphere Group in Gaborone, Botswana. Email, phone, and location details for customers and providers.',
    indexable: true,
  },
  {
    path: '/faq',
    title: 'FAQ | Market Sphere Group',
    description:
      'Answers to common questions about Market Sphere Group — signing up, finding providers, verification, and how the marketplace works.',
    indexable: true,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Market Sphere Group',
    description: 'How Market Sphere Group collects, uses, and protects your personal information.',
    indexable: true,
  },
  {
    path: '/terms',
    title: 'Terms of Service | Market Sphere Group',
    description:
      'Terms and conditions for using the Market Sphere Group marketplace and related services.',
    indexable: true,
  },
]

const SHOWCASE_ROUTES: RouteSeo[] = SHOWCASE_COLUMNS.map((column) => ({
  path: `/showcase/${column.slug}`,
  title: `${column.title} | Market Sphere Showcase`,
  description: column.description,
  indexable: true,
}))

/** Account and dashboard routes: served as real files, kept out of the index. */
const PRIVATE_ROUTES: RouteSeo[] = [
  { path: '/get-started', title: 'Get Started | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/login', title: 'Sign In | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/register', title: 'Create Account | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/forgot-password', title: 'Reset Password | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/auth/callback', title: 'Signing you in | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/auth/verify', title: 'Confirm your email | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/auth/reset-password', title: 'Set a new password | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/dashboard/customer', title: 'Customer Dashboard | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/dashboard/provider', title: 'Provider Dashboard | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
  { path: '/dashboard/admin', title: 'Admin Dashboard | Market Sphere Group', description: DEFAULT_SEO.description, indexable: false },
]

export const ROUTE_SEO: RouteSeo[] = [...CONTENT_ROUTES, ...SHOWCASE_ROUTES, ...PRIVATE_ROUTES]

export const INDEXABLE_ROUTES: RouteSeo[] = ROUTE_SEO.filter((route) => route.indexable)

export function canonicalUrl(pathname: string): string {
  if (pathname === '/' || pathname === '') return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${pathname.replace(/\/$/, '')}`
}

export function seoForPath(pathname: string): { title: string; description: string } {
  const normalized = pathname.replace(/\/$/, '') || '/'
  const match = ROUTE_SEO.find((route) => route.path === normalized)
  if (match) return { title: match.title, description: match.description }

  if (normalized.startsWith('/showcase/')) {
    const parts = normalized.split('/').filter(Boolean)
    if (parts.length >= 3) {
      return {
        title: 'Showcase Listing | Market Sphere Group',
        description:
          'View Market Sphere Group showcase opportunities and contact the team for more details.',
      }
    }
    return {
      title: 'Showcase Field | Market Sphere Group',
      description:
        'Browse Market Sphere Group showcase listings for this field across Botswana.',
    }
  }

  if (normalized.startsWith('/provider/')) {
    return {
      title: 'Verified Provider | Market Sphere Group',
      description:
        'View a verified Market Sphere Group service provider profile, services and contact details.',
    }
  }

  return {
    title: `${normalized.replace(/^\//, '').replace(/-/g, ' ') || 'Page'} | Market Sphere Group`,
    description: DEFAULT_SEO.description,
  }
}
