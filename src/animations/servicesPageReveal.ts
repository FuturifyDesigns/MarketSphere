import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const REVEAL_EASE = 'power2.out'
const FADE_EASE = 'power2.inOut'
const SCROLL_UNIT = 1.1
const DEFAULT_HOLD = 8
const MIN_HOLD = 4

type VideoController = {
  activeIndex: number | null
  videos: HTMLVideoElement[]
}

type SlideRange = {
  index: number
  start: number
  end: number
}

function createVideoController(root: HTMLElement): VideoController {
  return {
    activeIndex: null,
    videos: gsap.utils.toArray<HTMLVideoElement>('.svc-page__video', root),
  }
}

function waitForVideoMeta(video: HTMLVideoElement): Promise<number> {
  return new Promise((resolve) => {
    const finish = () => {
      const duration = video.duration
      resolve(duration && Number.isFinite(duration) ? duration : DEFAULT_HOLD)
    }

    video.load()
    if (video.readyState >= 1) finish()
    else video.addEventListener('loadedmetadata', finish, { once: true })
  })
}

function ensurePlaying(video: HTMLVideoElement | undefined) {
  if (!video || video.ended) return
  if (video.paused) void video.play().catch(() => {})
}

function activateSlideVideo(ctrl: VideoController, index: number | null) {
  if (ctrl.activeIndex === index) {
    if (index !== null) ensurePlaying(ctrl.videos[index])
    return
  }

  ctrl.activeIndex = index

  ctrl.videos.forEach((video, i) => {
    if (i === index) {
      void video.play().catch(() => {})
      return
    }
    video.pause()
  })
}

function pauseAllVideos(ctrl: VideoController) {
  ctrl.activeIndex = null
  ctrl.videos.forEach((video) => video.pause())
}

function buildSlideRanges(tl: gsap.core.Timeline, slideCount: number): SlideRange[] {
  const duration = tl.duration()
  const ranges: SlideRange[] = []

  for (let i = 0; i < slideCount; i++) {
    const start = (tl.labels[`service-${i}`] ?? 0) / duration
    const end =
      i < slideCount - 1
        ? (tl.labels[`service-${i + 1}`] ?? duration) / duration
        : 1

    ranges.push({ index: i, start, end })
  }

  return ranges
}

function getActiveSlideIndex(progress: number, ranges: SlideRange[], current: number | null): number | null {
  if (current !== null) {
    const active = ranges[current]
    if (active) {
      const margin = (active.end - active.start) * 0.12
      if (progress >= active.start + margin && progress <= active.end - margin * 0.35) {
        return current
      }
    }
  }

  for (let i = ranges.length - 1; i >= 0; i--) {
    if (progress >= ranges[i].start) return i
  }

  return null
}

function addMediaAnimation(tl: gsap.core.Timeline, slide: HTMLElement, label: string) {
  tl.fromTo(
    slide.querySelector('.svc-page__media'),
    { opacity: 0, scale: 0.94, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: REVEAL_EASE },
    label,
  )
}

function startPlaybackLoop(ctrl: VideoController, getActive: () => boolean) {
  let raf = 0

  const tick = () => {
    if (getActive() && ctrl.activeIndex !== null) {
      ensurePlaying(ctrl.videos[ctrl.activeIndex])
    }
    raf = window.requestAnimationFrame(tick)
  }

  raf = window.requestAnimationFrame(tick)
  return () => window.cancelAnimationFrame(raf)
}

export function initServicesPageShowcase(root: HTMLElement) {
  const videoCtrl = createVideoController(root)
  let disposed = false
  let stopPlaybackLoop: (() => void) | undefined
  let ctx: gsap.Context | undefined

  videoCtrl.videos.forEach((video) => {
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.preload = 'auto'
  })

  if (prefersReducedMotion()) {
    gsap.set(root.querySelectorAll('.svc-page__slide, .svc-page__intro'), {
      autoAlpha: 1,
      pointerEvents: 'auto',
    })
    gsap.set(root.querySelectorAll('.svc-page__media, .svc-page__copy > *'), {
      opacity: 1,
      y: 0,
      clearProps: 'transform,opacity',
    })
    return () => pauseAllVideos(videoCtrl)
  }

  const boot = async () => {
    const durations = await Promise.all(videoCtrl.videos.map(waitForVideoMeta))
    if (disposed) return

    pauseAllVideos(videoCtrl)

    ctx = gsap.context(() => {
      const pin = root.querySelector<HTMLElement>('.svc-page__pin')
      const intro = root.querySelector<HTMLElement>('.svc-page__intro')
      const slides = gsap.utils.toArray<HTMLElement>('.svc-page__slide', root)
      const dots = gsap.utils.toArray<HTMLElement>('.svc-page__dot', root)
      const progress = root.querySelector<HTMLElement>('.svc-page__progress-fill')

      if (!pin || !intro || slides.length === 0) return

      gsap.set(slides, { autoAlpha: 0, pointerEvents: 'none' })
      gsap.set(intro, { autoAlpha: 1, pointerEvents: 'auto' })
      gsap.set(dots, { scale: 1, opacity: 0.35 })
      if (dots[0]) gsap.set(dots[0], { scale: 1.2, opacity: 1 })
      if (progress) gsap.set(progress, { scaleY: 1 / slides.length })

      slides.forEach((slide) => {
        gsap.set(slide.querySelectorAll('.svc-page__copy > *'), { opacity: 0, y: 22 })
        gsap.set(slide.querySelector('.svc-page__media'), { opacity: 0, scale: 0.94, y: 20 })
      })

      const tl = gsap.timeline({ paused: true, defaults: { ease: REVEAL_EASE } })

      tl.addLabel('intro')
      tl.fromTo(
        gsap.utils.toArray(intro.children),
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: REVEAL_EASE },
        'intro',
      )
      tl.to({}, { duration: 0.45 })

      slides.forEach((slide, index) => {
        const label = `service-${index}`
        const copyItems = slide.querySelectorAll('.svc-page__copy > *')
        const holdDuration = Math.max(MIN_HOLD, durations[index] ?? DEFAULT_HOLD)

        if (index === 0) {
          tl.to(intro, { autoAlpha: 0, duration: 0.28, ease: FADE_EASE })
          tl.set(intro, { pointerEvents: 'none' })
        } else {
          const prev = slides[index - 1]
          tl.to(prev, { autoAlpha: 0, duration: 0.24, ease: FADE_EASE })
          tl.set(prev, { pointerEvents: 'none' })
        }

        tl.addLabel(label)
        tl.set(slide, { autoAlpha: 1, pointerEvents: 'auto' }, label)
        tl.to(dots, { scale: 1, opacity: 0.35, duration: 0.15 }, label)
        if (dots[index]) {
          tl.to(dots[index], { scale: 1.25, opacity: 1, duration: 0.2 }, label)
        }
        if (progress) {
          tl.to(
            progress,
            { scaleY: (index + 1) / slides.length, duration: holdDuration * 0.12, ease: 'none' },
            label,
          )
        }

        addMediaAnimation(tl, slide, label)

        tl.fromTo(
          copyItems,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: holdDuration * 0.14, stagger: holdDuration * 0.03 },
          `${label}+=0.08`,
        )
        tl.to({}, { duration: holdDuration })
      })

      const slideRanges = buildSlideRanges(tl, slides.length)
      let showcaseActive = false

      ScrollTrigger.create({
        trigger: pin,
        start: 'top top',
        end: () => `+=${tl.duration() * window.innerHeight * SCROLL_UNIT}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.65,
        anticipatePin: 0,
        invalidateOnRefresh: true,
        animation: tl,
        id: 'services-page-showcase',
        onToggle: (self) => {
          showcaseActive = self.isActive
          if (!self.isActive) pauseAllVideos(videoCtrl)
        },
        onUpdate: (self) => {
          if (!self.isActive) return

          const index = getActiveSlideIndex(self.progress, slideRanges, videoCtrl.activeIndex)
          if (index === null) {
            if (videoCtrl.activeIndex !== null) pauseAllVideos(videoCtrl)
            return
          }

          activateSlideVideo(videoCtrl, index)
        },
      })

      stopPlaybackLoop = startPlaybackLoop(videoCtrl, () => showcaseActive)

      gsap.set(intro, { autoAlpha: 1, pointerEvents: 'auto' })
      scheduleScrollRefresh()
    }, root)
  }

  void boot()

  return () => {
    disposed = true
    stopPlaybackLoop?.()
    pauseAllVideos(videoCtrl)
    ctx?.revert()
  }
}
