import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isMobileViewport } from '../lib/nativeScroll'
import { flushScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const REVEAL_EASE = 'power2.out'
const SCRUB = true

function initMobileSectionReveal(section: HTMLElement, triggerId: string): (() => void) | undefined {
  const ctx = gsap.context(() => {
    const label = section.querySelector<HTMLElement>('.home-section__label')
    const titleWord = section.querySelector<HTMLElement>('.home-section__title-word')
    const title = section.querySelector<HTMLElement>('.home-section__title')
    const lead = section.querySelector<HTMLElement>('.home-section__lead')
    const items = gsap.utils.toArray<HTMLElement>('.home-section__item', section)
    const footer = section.querySelector<HTMLElement>('.home-section__footer')
    const titleEl = titleWord || title

    const headerTargets = [label, titleEl, lead].filter(Boolean) as HTMLElement[]
    if (headerTargets.length) {
      gsap.from(headerTargets, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: REVEAL_EASE,
        scrollTrigger: {
          trigger: section,
          start: 'top 88%',
          once: true,
          id: triggerId,
        },
      })
    }

    items.forEach((item) => {
      gsap.from(item, {
        opacity: 0,
        y: 24,
        duration: 0.5,
        ease: REVEAL_EASE,
        scrollTrigger: {
          trigger: item,
          start: 'top 90%',
          once: true,
        },
      })
    })

    if (footer) {
      gsap.from(footer, {
        opacity: 0,
        y: 16,
        duration: 0.45,
        ease: REVEAL_EASE,
        scrollTrigger: {
          trigger: footer,
          start: 'top 92%',
          once: true,
        },
      })
    }
  }, section)

  return () => ctx.revert()
}

function initSectionScrollReveal(
  section: HTMLElement,
  triggerId: string,
  scrollMultiplier = 1.15,
): (() => void) | undefined {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

  if (isMobileViewport()) {
    return initMobileSectionReveal(section, triggerId)
  }

  ScrollTrigger.getById(triggerId)?.kill()

  const ctx = gsap.context(() => {
    const label = section.querySelector<HTMLElement>('.home-section__label')
    const titleWord = section.querySelector<HTMLElement>('.home-section__title-word')
    const title = section.querySelector<HTMLElement>('.home-section__title')
    const lead = section.querySelector<HTMLElement>('.home-section__lead')
    const items = gsap.utils.toArray<HTMLElement>('.home-section__item', section)
    const footer = section.querySelector<HTMLElement>('.home-section__footer')
    const titleEl = titleWord || title

    const hide = (el: HTMLElement | null, y: number, x = 0, scale = 1) => {
      if (el) gsap.set(el, { opacity: 0, y, x, scale })
    }

    hide(label, 28)
    hide(titleEl, 40, 0, 0.9)
    hide(lead, 24)
    items.forEach((item, i) => {
      const fromLeft = i % 2 === 0
      hide(item, 36 + i * 6, fromLeft ? -48 : 48, 0.96)
    })
    hide(footer, 20)

    const tl = gsap.timeline({
      defaults: { ease: REVEAL_EASE },
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: () => `+=${window.innerHeight * scrollMultiplier}`,
        scrub: SCRUB,
        invalidateOnRefresh: true,
        refreshPriority: 3,
        id: triggerId,
      },
    })

    if (label) {
      tl.fromTo(label, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.5 })
    }

    if (titleEl) {
      tl.fromTo(
        titleEl,
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.85 },
        '-=0.12',
      )
    }

    if (lead) {
      tl.fromTo(lead, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55 }, '-=0.38')
    }

    items.forEach((item, i) => {
      const fromLeft = i % 2 === 0
      tl.fromTo(
        item,
        { opacity: 0, y: 36 + i * 6, x: fromLeft ? -48 : 48, scale: 0.96 },
        { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.75 },
        i === 0 ? '-=0.1' : '+=0.14',
      )
    })

    if (footer) {
      tl.fromTo(footer, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '+=0.12')
    }
  }, section)

  return () => ctx.revert()
}

let activeCleanup: (() => void) | undefined

/** Providers + Testimonials — init after Services pin so ScrollTrigger positions stay correct. */
export function initBelowFoldSections(root: HTMLElement): (() => void) | undefined {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

  activeCleanup?.()

  const cleanups: Array<() => void> = []

  const providers = root.querySelector<HTMLElement>('.section--providers')
  const testimonials = root.querySelector<HTMLElement>('.section--testimonials')

  if (providers) {
    const cleanup = initSectionScrollReveal(providers, 'providers-reveal', 1.15)
    if (cleanup) cleanups.push(cleanup)
  }

  if (testimonials) {
    const cleanup = initSectionScrollReveal(testimonials, 'testimonials-reveal', 1.3)
    if (cleanup) cleanups.push(cleanup)
  }

  if (cleanups.length === 0) return undefined

  const cleanup = () => {
    cleanups.forEach((fn) => fn())
    if (activeCleanup === cleanup) activeCleanup = undefined
  }

  activeCleanup = cleanup

  requestAnimationFrame(() => {
    flushScrollRefresh()
  })

  return cleanup
}
