import { SERVICES } from './constants'

const base = import.meta.env.BASE_URL

const hiddenVideos: HTMLVideoElement[] = []
let preloadPromise: Promise<void> | null = null

function videoUrl(path: string) {
  return `${base}${path}`
}

function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 10000) {
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

function warmVideo(url: string) {
  const video = document.createElement('video')
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.playsInline = true
  video.preload = 'auto'
  video.setAttribute('playsinline', '')
  video.src = url
  video.style.cssText =
    'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px'
  document.body.appendChild(video)
  hiddenVideos.push(video)

  video.load()
  void video.play().catch(() => {})

  return waitForVideoReady(video)
}

/** Fetch + decode all service videos as early as possible. */
export function preloadServiceVideos() {
  if (preloadPromise) return preloadPromise

  preloadPromise = Promise.all(
    SERVICES.map(async (service) => {
      const url = videoUrl(service.video)
      try {
        await fetch(url)
      } catch {
        /* cache warm best-effort */
      }
      await warmVideo(url)
    }),
  ).then(() => undefined)

  return preloadPromise
}

export function releaseServiceVideoPreload() {
  hiddenVideos.splice(0).forEach((video) => {
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
  })
  preloadPromise = null
}

export function primeVisibleServiceVideos(root: HTMLElement) {
  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>('.svc-page__video'))

  videos.forEach((video) => {
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'auto'
    video.load()
    void video.play().catch(() => {})
  })

  return videos
}
