import { HERO_VIDEO_PATH, preloadHeroVideo } from './heroVideoCache'
import { LOGO_PATH } from './constants'
import { preloadMascots } from './mascots'

let started = false

/** Warm logo, mascots, and hero video as early as possible (before intro finishes). */
export function preloadCriticalAssets() {
  if (started || typeof window === 'undefined') return
  started = true

  const base = import.meta.env.BASE_URL

  const logoHref = `${base}${LOGO_PATH}`
  const videoHref = `${base}${HERO_VIDEO_PATH}`

  for (const [href, as] of [
    [logoHref, 'image'],
    [videoHref, 'video'],
  ] as const) {
    if (document.querySelector(`link[rel="preload"][href="${href}"]`)) continue
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = as
    link.href = href
    if (as === 'image') link.setAttribute('fetchpriority', 'high')
    document.head.appendChild(link)
  }

  preloadMascots()

  const logo = new Image()
  logo.decoding = 'sync'
  logo.fetchPriority = 'high'
  logo.src = logoHref

  void preloadHeroVideo()
}
