import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

type PageSeo = {
  title: string
  description: string
}

const DEFAULT: PageSeo = {
  title: 'Market Sphere Group — Verified Service Providers in Botswana',
  description:
    'Market Sphere Group connects customers with verified service providers across Botswana — tutoring, real estate, youth empowerment, marketing, and more.',
}

const PAGES: Record<string, PageSeo> = {
  '/': DEFAULT,
  '/about': {
    title: 'About Market Sphere Group | Botswana Marketplace',
    description:
      'Learn about Market Sphere Group (Pty) Ltd — our mission, values, and how we connect customers with verified service providers across Botswana.',
  },
  '/services': {
    title: 'Our Services | Market Sphere Group',
    description:
      'Explore Market Sphere Group services: academic tuition, real estate, youth empowerment, entrepreneurship, and platform marketing across Botswana.',
  },
  '/browse': {
    title: 'Browse Providers | Market Sphere Group',
    description:
      'Browse verified service providers across Botswana. Filter by category and connect with trusted professionals on Market Sphere Group.',
  },
  '/contact': {
    title: 'Contact Us | Market Sphere Group',
    description:
      'Get in touch with Market Sphere Group in Gaborone, Botswana. Email, phone, and location details for customers and providers.',
  },
  '/faq': {
    title: 'FAQ | Market Sphere Group',
    description:
      'Answers to common questions about Market Sphere Group — signing up, finding providers, verification, and how the marketplace works.',
  },
  '/privacy': {
    title: 'Privacy Policy | Market Sphere Group',
    description: 'How Market Sphere Group collects, uses, and protects your personal information.',
  },
  '/terms': {
    title: 'Terms of Service | Market Sphere Group',
    description: 'Terms and conditions for using the Market Sphere Group marketplace and related services.',
  },
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertCanonical(pathname: string) {
  const href =
    pathname === '/'
      ? 'https://marketspheregroup.com/'
      : `https://marketspheregroup.com/#${pathname}`

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

/** Keeps title/description/OG tags in sync with the active hash route for crawlers that run JS. */
export function DocumentSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = PAGES[pathname] ?? {
      title: `${pathname.replace(/^\//, '').replace(/-/g, ' ') || 'Page'} | Market Sphere Group`,
      description: DEFAULT.description,
    }

    document.title = seo.title
    upsertMeta('name', 'description', seo.description)
    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', pathname === '/' ? 'https://marketspheregroup.com/' : `https://marketspheregroup.com/#${pathname}`)
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)
    upsertCanonical(pathname)
  }, [pathname])

  return null
}
