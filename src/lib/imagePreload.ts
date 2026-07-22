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
export function preloadImage(path: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  const href = imageHref(path)
  if (loaded.has(href)) return Promise.resolve()

  const pending = inflight.get(href)
  if (pending) return pending

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    if (priority === 'high') img.fetchPriority = 'high'
    else img.fetchPriority = 'low'
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

/**
 * Warm secondary UI images without competing with first paint.
 * Logo/mascots/hero video stay on the critical path separately.
 */
export function preloadAllImages() {
  if (typeof window === 'undefined') return

  const run = () => {
    for (const path of STATIC_IMAGES) {
      // Skip logo — already on the critical path.
      if (path === 'logo.webp') continue
      void preloadImage(path, 'low')
    }
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 3500 })
  } else {
    window.setTimeout(run, 1800)
  }
}

/** @deprecated Use preloadAllImages */
export function preloadAuthCovers() {
  void preloadImage('auth/sign-in.webp')
  void preloadImage('auth/sign-up.webp')
}
