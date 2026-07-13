const base = import.meta.env.BASE_URL

export const MASCOT_PATHS = {
  welcome: `${base}mascots/welcome.webp`,
  thumbsUp: `${base}mascots/thumbs-up.webp`,
  explaining: `${base}mascots/explaining.webp`,
  allDone: `${base}mascots/all-done.webp`,
} as const

export type MascotKey = keyof typeof MASCOT_PATHS

const mascotLoaded = new Set<string>()

/** Warm mascot images in the browser cache as early as possible (~50KB each WebP). */
export function preloadMascots() {
  if (typeof window === 'undefined') return

  for (const href of Object.values(MASCOT_PATHS)) {
    if (mascotLoaded.has(href)) continue

    if (!document.querySelector(`link[rel="preload"][href="${href}"]`)) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = href
      link.setAttribute('fetchpriority', 'high')
      document.head.appendChild(link)
    }

    const img = new Image()
    img.decoding = 'sync'
    img.fetchPriority = 'high'
    img.onload = () => mascotLoaded.add(href)
    img.onerror = () => mascotLoaded.add(href)
    img.src = href
  }
}

export function isMascotPreloaded(key: MascotKey) {
  return mascotLoaded.has(MASCOT_PATHS[key])
}
