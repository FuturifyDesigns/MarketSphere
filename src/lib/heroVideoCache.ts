export const HERO_VIDEO_PATH = 'home/hero-video.mp4'

const base = import.meta.env.BASE_URL

let blobUrl: string | null = null
let ready = false
let preloadPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

function localUrl() {
  return `${base}${HERO_VIDEO_PATH}`
}

function waitForEvent(video: HTMLVideoElement, event: 'canplay' | 'canplaythrough', timeoutMs: number) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timer)
      resolve()
    }

    if (event === 'canplay' && video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      finish()
      return
    }

    if (event === 'canplaythrough' && video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      finish()
      return
    }

    const timer = window.setTimeout(finish, timeoutMs)
    video.addEventListener(event, finish, { once: true })
    video.addEventListener('error', finish, { once: true })
  })
}

async function fetchToBlob(): Promise<string | null> {
  try {
    const response = await fetch(localUrl())
    if (!response.ok) return null
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

async function warmDecoder(src: string) {
  const video = document.createElement('video')
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.playsInline = true
  video.preload = 'auto'
  video.setAttribute('playsinline', '')
  video.src = src
  video.style.cssText =
    'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;z-index:-1'
  document.body.appendChild(video)
  video.load()
  void video.play().catch(() => {})
  await waitForEvent(video, 'canplay', 3500)
  video.pause()
  video.currentTime = 0
  video.remove()
  ready = true
  notify()
}

export function preloadHeroVideo() {
  if (preloadPromise) return preloadPromise

  preloadPromise = (async () => {
    blobUrl = await fetchToBlob()
    if (blobUrl) notify()
    await warmDecoder(blobUrl ?? localUrl())
  })()

  return preloadPromise
}

export function isHeroVideoReady() {
  return ready
}

export function getHeroVideoSrc() {
  return blobUrl ?? localUrl()
}

export function subscribeHeroVideoCache(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
