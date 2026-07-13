import { SERVICES } from './constants'

const base = import.meta.env.BASE_URL

const STATIC_IMAGES = [
  'logo.webp',
  'auth/sign-in.webp',
  'auth/sign-up.webp',
  ...SERVICES.map((service) => service.image),
] as const

const loaded = new Set<string>()
const inflight = new Map<string, Promise<void>>()

function imageHref(path: string) {
  return `${base}${path}`
}

/** Warm the browser image cache for a static public asset. */
export function preloadImage(path: string): Promise<void> {
  const href = imageHref(path)
  if (loaded.has(href)) return Promise.resolve()

  const pending = inflight.get(href)
  if (pending) return pending

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'sync'
    img.fetchPriority = 'high'
    img.onload = () => {
      loaded.add(href)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = href
  })

  inflight.set(href, promise)
  return promise
}

export function isImagePreloaded(path: string) {
  return loaded.has(imageHref(path))
}

/** Preload all static UI images as early as possible. */
export function preloadAllImages() {
  for (const path of STATIC_IMAGES) {
    const href = imageHref(path)

    if (!document.querySelector(`link[rel="preload"][href="${href}"]`)) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = href
      link.setAttribute('fetchpriority', 'high')
      document.head.appendChild(link)
    }

    void preloadImage(path)
  }
}

/** @deprecated Use preloadAllImages */
export function preloadAuthCovers() {
  void preloadImage('auth/sign-in.webp')
  void preloadImage('auth/sign-up.webp')
}
