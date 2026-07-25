import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { canonicalUrl, seoForPath } from '../../lib/seoRoutes'

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

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

/** Keeps title/description/OG tags in sync with the active route. */
export function DocumentSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = seoForPath(pathname)
    const href = canonicalUrl(pathname)

    document.title = seo.title
    upsertMeta('name', 'description', seo.description)
    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', href)
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)
    upsertCanonical(href)
  }, [pathname])

  return null
}
