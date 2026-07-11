import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const REVEAL_EASE = 'power2.out'
const FADE_EASE = 'power2.inOut'
const SCROLL_UNIT = 0.5

function addIllustrationAnimation(tl: gsap.core.Timeline, slide: HTMLElement, label: string) {
  const drawPaths = slide.querySelectorAll<SVGPathElement>('.svc-illus__draw')
  drawPaths.forEach((path) => {
    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
  })

  tl.fromTo(
    slide.querySelector('.svc-page__illus'),
    { opacity: 0, scale: 0.92, y: 24 },
    { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: REVEAL_EASE },
    label,
  )
  if (drawPaths.length) {
    tl.to(
      drawPaths,
      { strokeDashoffset: 0, duration: 0.42, stagger: 0.06, ease: 'none' },
      `${label}+=0.08`,
    )
  }
  tl.fromTo(
    slide.querySelectorAll('.svc-illus__float, .svc-illus__pulse'),
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.28, stagger: 0.05, ease: REVEAL_EASE },
    `${label}+=0.12`,
  )
}

export function initServicesPageShowcase(root: HTMLElement) {
  if (prefersReducedMotion()) {
    gsap.set(root.querySelectorAll('.svc-page__slide, .svc-page__intro'), {
      autoAlpha: 1,
      pointerEvents: 'auto',
    })
    gsap.set(root.querySelectorAll('.svc-page__illus, .svc-page__copy > *'), {
      opacity: 1,
      y: 0,
      clearProps: 'transform,opacity',
    })
    return () => {}
  }

  const ctx = gsap.context(() => {
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
      gsap.set(slide.querySelector('.svc-page__illus'), { opacity: 0, scale: 0.92, y: 24 })
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
      const segment = 1.15

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
          { scaleY: (index + 1) / slides.length, duration: segment * 0.2, ease: 'none' },
          label,
        )
      }

      addIllustrationAnimation(tl, slide, label)

      tl.fromTo(
        copyItems,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: segment * 0.22, stagger: segment * 0.05 },
        `${label}+=0.1`,
      )
      tl.to({}, { duration: segment * 0.18 })
    })

    ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: () => `+=${tl.duration() * window.innerHeight * SCROLL_UNIT}`,
      pin: true,
      pinSpacing: true,
      scrub: 1.1,
      anticipatePin: 0,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      animation: tl,
      id: 'services-page-showcase',
    })

    gsap.set(intro, { autoAlpha: 1, pointerEvents: 'auto' })
    scheduleScrollRefresh()
  }, root)

  return () => ctx.revert()
}
