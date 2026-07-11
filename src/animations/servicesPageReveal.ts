import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { flushScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const REVEAL_EASE = 'power2.out'
const FADE_EASE = 'power2.inOut'
const SCROLL_UNIT = 0.85
const SLIDE_SEGMENT = 1.45

type VideoController = {
  activeIndex: number | null
  videos: HTMLVideoElement[]
}

function createVideoController(root: HTMLElement): VideoController {
  return {
    activeIndex: null,
    videos: gsap.utils.toArray<HTMLVideoElement>('.svc-page__video', root),
  }
}

function getActiveSlideIndex(
  tl: gsap.core.Timeline,
  progress: number,
  slideCount: number,
): number | null {
  const time = progress * tl.duration()
  const firstLabel = tl.labels['service-0']
  if (firstLabel === undefined || time < firstLabel) return null

  for (let i = slideCount - 1; i >= 0; i--) {
    const label = tl.labels[`service-${i}`]
    if (label !== undefined && time >= label) return i
  }

  return null
}

function activateSlideVideo(ctrl: VideoController, index: number | null) {
  if (ctrl.activeIndex === index) {
    if (index !== null && ctrl.videos[index]?.paused) {
      void ctrl.videos[index].play().catch(() => {})
    }
    return
  }

  ctrl.activeIndex = index

  ctrl.videos.forEach((video, i) => {
    if (i === index) {
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  })
}

function pauseAllVideos(ctrl: VideoController) {
  ctrl.activeIndex = null
  ctrl.videos.forEach((video) => video.pause())
}

function addMediaAnimation(tl: gsap.core.Timeline, slide: HTMLElement, label: string) {
  tl.fromTo(
    slide.querySelector('.svc-page__media'),
    { opacity: 0, scale: 0.94, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: REVEAL_EASE },
    label,
  )
}

export function initServicesPageShowcase(root: HTMLElement) {
  const videoCtrl = createVideoController(root)

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

  const ctx = gsap.context(() => {
    const pin = root.querySelector<HTMLElement>('.svc-page__pin')
    const intro = root.querySelector<HTMLElement>('.svc-page__intro')
    const slides = gsap.utils.toArray<HTMLElement>('.svc-page__slide', root)
    const dots = gsap.utils.toArray<HTMLElement>('.svc-page__dot', root)
    const progress = root.querySelector<HTMLElement>('.svc-page__progress-fill')

    if (!pin || !intro || slides.length === 0) return

    pauseAllVideos(videoCtrl)

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
          { scaleY: (index + 1) / slides.length, duration: SLIDE_SEGMENT * 0.18, ease: 'none' },
          label,
        )
      }

      addMediaAnimation(tl, slide, label)

      tl.fromTo(
        copyItems,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: SLIDE_SEGMENT * 0.22, stagger: SLIDE_SEGMENT * 0.05 },
        `${label}+=0.08`,
      )
      tl.to({}, { duration: SLIDE_SEGMENT * 0.55 })
    })

    const syncVideo = (progress: number) => {
      const index = getActiveSlideIndex(tl, progress, slides.length)
      if (index === null) {
        pauseAllVideos(videoCtrl)
        return
      }
      activateSlideVideo(videoCtrl, index)
    }

    ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: () => `+=${tl.duration() * window.innerHeight * SCROLL_UNIT}`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 0,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      animation: tl,
      id: 'services-page-showcase',
      onUpdate: (self) => {
        if (!self.isActive) return
        syncVideo(self.progress)
      },
      onLeave: () => pauseAllVideos(videoCtrl),
      onLeaveBack: () => pauseAllVideos(videoCtrl),
    })

    const st = ScrollTrigger.getById('services-page-showcase')
    if (st) syncVideo(st.progress)

    gsap.set(intro, { autoAlpha: 1, pointerEvents: 'auto' })
    flushScrollRefresh()
  }, root)

  return () => {
    pauseAllVideos(videoCtrl)
    ctx.revert()
  }
}
