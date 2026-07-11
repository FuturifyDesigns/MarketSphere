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

function warmDecoder(src: string) {
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
}

/** Start downloading + decoding all service videos immediately. */
export function preloadServiceVideos() {
  if (preloadPromise) return preloadPromise

  preloadStarted = true
  preloadPromise = Promise.all(
    SERVICES.map(async (service) => {
      const blobUrl = await fetchToBlob(service.video)
      if (blobUrl) {
        blobByVideo.set(service.video, blobUrl)
        warmDecoder(blobUrl)
      } else {
        warmDecoder(localUrl(service.video))
      }
      readyByVideo.set(service.video, true)
      notify()
    }),
  ).then(() => undefined)

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
