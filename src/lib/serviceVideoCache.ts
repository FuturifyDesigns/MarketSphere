import { SERVICES } from './constants'

const base = import.meta.env.BASE_URL
const CDN_BASE =
  'https://media.githubusercontent.com/media/FuturifyDesigns/MarketSphere/main/public/'

const blobByVideo = new Map<string, string>()
const readyByVideo = new Map<string, boolean>()
const listeners = new Set<() => void>()

let preloadStarted = false
let preloadPromise: Promise<void> | null = null

function notify() {
  listeners.forEach((listener) => listener())
}

function localUrl(path: string) {
  return `${base}${path}`
}

function cdnUrl(path: string) {
  return `${CDN_BASE}${path}`
}

function waitForCanPlayThrough(video: HTMLVideoElement, timeoutMs = 15000) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timer)
      resolve()
    }

    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      finish()
      return
    }

    const timer = window.setTimeout(finish, timeoutMs)
    video.addEventListener('canplaythrough', finish, { once: true })
    video.addEventListener('error', finish, { once: true })
  })
}

async function fetchToBlob(path: string): Promise<string | null> {
  for (const url of [localUrl(path), cdnUrl(path)]) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue
      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch {
      /* try next source */
    }
  }
  return null
}

async function warmDecoder(path: string, src: string) {
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
  await waitForCanPlayThrough(video)
  readyByVideo.set(path, true)
  notify()
}

async function preloadOne(path: string) {
  const blobUrl = await fetchToBlob(path)
  if (blobUrl) {
    blobByVideo.set(path, blobUrl)
    await warmDecoder(path, blobUrl)
    return
  }

  await warmDecoder(path, localUrl(path))
}

/** Start downloading + decoding all service videos immediately (slide order first). */
export function preloadServiceVideos() {
  if (preloadPromise) return preloadPromise

  preloadStarted = true
  preloadPromise = (async () => {
    for (const service of SERVICES) {
      await preloadOne(service.video)
    }
  })()

  return preloadPromise
}

export function isServiceVideoPreloadStarted() {
  return preloadStarted
}

export function isServiceVideoReady(path: string) {
  return readyByVideo.get(path) ?? false
}

export function getServiceVideoSrc(path: string) {
  return blobByVideo.get(path) ?? localUrl(path)
}

export function subscribeServiceVideoCache(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
