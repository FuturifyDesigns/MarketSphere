import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { flushScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const REVEAL_EASE = 'power2.out'
const FADE_EASE = 'power2.inOut'

type ServicesPageConfig = {
  scrub: number | boolean
  scrollUnit: number
  slideSegment: number
}

function addMediaAnimation(tl: gsap.core.Timeline, slide: HTMLElement, label: string) {
  tl.fromTo(
    slide.querySelector('.svc-page__media'),
    { scale: 0.96, y: 16 },
    { scale: 1, y: 0, duration: 0.35, ease: REVEAL_EASE },
    label,
  )
}

function runServicesPagePin(root: HTMLElement, config: ServicesPageConfig) {
  const pin = root.querySelector<HTMLElement>('.svc-page__pin')
  const intro = root.querySelector<HTMLElement>('.svc-page__intro')
  const slides = gsap.utils.toArray<HTMLElement>('.svc-page__slide', root)
  const dots = gsap.utils.toArray<HTMLElement>('.svc-page__dot', root)
  const progress = root.querySelector<HTMLElement>('.svc-page__progress-fill')

  if (!pin || !intro || slides.length === 0) return

  gsap.set(slides, { opacity: 0, pointerEvents: 'none', visibility: 'visible', zIndex: 1 })
  gsap.set(intro, { autoAlpha: 1, pointerEvents: 'auto' })
  gsap.set(dots, { scale: 1, opacity: 0.35 })
  if (dots[0]) gsap.set(dots[0], { scale: 1.2, opacity: 1 })
  if (progress) gsap.set(progress, { scaleY: 1 / slides.length })

  slides.forEach((slide) => {
    gsap.set(slide.querySelectorAll('.svc-page__copy > *'), { opacity: 0, y: 22 })
    gsap.set(slide.querySelector('.svc-page__media'), { opacity: 1, scale: 0.96, y: 16 })
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
      tl.to(prev, { opacity: 0, duration: 0.24, ease: FADE_EASE })
      tl.set(prev, { pointerEvents: 'none', zIndex: 1 })
    }

    tl.addLabel(label)
    tl.set(slide, { opacity: 1, pointerEvents: 'auto', zIndex: 2 }, label)
    tl.to(dots, { scale: 1, opacity: 0.35, duration: 0.15 }, label)
    if (dots[index]) {
      tl.to(dots[index], { scale: 1.25, opacity: 1, duration: 0.2 }, label)
    }
    if (progress) {
      tl.to(
        progress,
        { scaleY: (index + 1) / slides.length, duration: config.slideSegment * 0.18, ease: 'none' },
        label,
      )
    }

    addMediaAnimation(tl, slide, label)

    tl.fromTo(
      copyItems,
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: config.slideSegment * 0.22,
        stagger: config.slideSegment * 0.05,
      },
      `${label}+=0.08`,
    )
    tl.to({}, { duration: config.slideSegment * 0.55 })
  })

  ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => `+=${tl.duration() * window.innerHeight * config.scrollUnit}`,
    pin: true,
    pinSpacing: true,
    scrub: config.scrub,
    anticipatePin: 0,
    invalidateOnRefresh: true,
    fastScrollEnd: true,
    animation: tl,
    id: 'services-page-showcase',
  })

  gsap.set(intro, { autoAlpha: 1, pointerEvents: 'auto' })
}

function runMobileServicesPageStack(root: HTMLElement) {
  const pin = root.querySelector<HTMLElement>('.svc-page__pin')
  const intro = root.querySelector<HTMLElement>('.svc-page__intro')
  const stage = root.querySelector<HTMLElement>('.svc-page__stage')
  const slides = gsap.utils.toArray<HTMLElement>('.svc-page__slide', root)

  // Clear any leftover pin/overlay styles from desktop transitions or previous inits.
  if (pin) gsap.set(pin, { clearProps: 'height,overflow,transform' })
  if (stage) gsap.set(stage, { clearProps: 'all' })
  if (intro) {
    gsap.set(intro, {
      autoAlpha: 1,
      pointerEvents: 'auto',
      clearProps: 'position,inset,top,left,right,bottom,transform,width,height',
    })
  }

  gsap.set(slides, {
    opacity: 1,
    autoAlpha: 1,
    pointerEvents: 'auto',
    visibility: 'visible',
    clearProps: 'position,inset,top,left,right,bottom,transform,zIndex,width,height',
  })

  slides.forEach((slide) => {
    gsap.set(slide.querySelectorAll('.svc-page__copy > *'), {
      opacity: 1,
      y: 0,
      clearProps: 'transform,opacity',
    })
    gsap.set(slide.querySelector('.svc-page__media'), {
      opacity: 1,
      y: 0,
      scale: 1,
      clearProps: 'transform,opacity',
    })
  })

  if (intro) {
    gsap.fromTo(
      intro.children,
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: REVEAL_EASE,
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: intro,
          start: 'top 88%',
          once: true,
        },
      },
    )
  }

  slides.forEach((slide) => {
    const media = slide.querySelector('.svc-page__media')
    const copy = slide.querySelectorAll('.svc-page__copy > *')

    if (media) {
      gsap.fromTo(
        media,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: REVEAL_EASE,
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: slide,
            start: 'top 90%',
            once: true,
          },
        },
      )
    }

    if (copy.length) {
      gsap.fromTo(
        copy,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: REVEAL_EASE,
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: slide,
            start: 'top 86%',
            once: true,
          },
        },
      )
    }
  })
}

export function initServicesPageShowcase(root: HTMLElement) {
  if (prefersReducedMotion()) {
    gsap.set(root.querySelectorAll('.svc-page__slide, .svc-page__intro'), {
      opacity: 1,
      pointerEvents: 'auto',
      visibility: 'visible',
    })
    gsap.set(root.querySelectorAll('.svc-page__media, .svc-page__copy > *'), {
      opacity: 1,
      y: 0,
      clearProps: 'transform',
    })
    return () => {}
  }

  const ctx = gsap.context(() => {
    const mm = gsap.matchMedia()

    mm.add('(min-width: 901px)', () => {
      runServicesPagePin(root, { scrub: true, scrollUnit: 0.85, slideSegment: 1.45 })
    })

    mm.add('(max-width: 900px)', () => {
      runMobileServicesPageStack(root)
    })

    flushScrollRefresh()
  }, root)

  return () => ctx.revert()
}
