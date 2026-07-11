import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FADE_EASE = 'power2.inOut'
const REVEAL_EASE = 'power2.out'

type SectionConfig = {
  itemDuration: number
  gap: number
  scrollMultiplier: number
  perItem: number
  scrub: number
}

function setSplitItemInitial(item: HTMLElement, index: number) {
  const fromLeft = index % 2 === 0
  gsap.set(item, {
    opacity: 0,
    x: fromLeft ? -70 : 70,
    scale: 0.94,
    clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
  })
}

function buildBelowFoldScrollSection(section: HTMLElement, config: SectionConfig) {
  const label = section.querySelector<HTMLElement>('.home-section__label')
  const titleWord = section.querySelector<HTMLElement>('.home-section__title-word')
  const title = section.querySelector<HTMLElement>('.home-section__title')
  const lead = section.querySelector<HTMLElement>('.home-section__lead')
  const items = gsap.utils.toArray<HTMLElement>('.home-section__item', section)
  const footer = section.querySelector<HTMLElement>('.home-section__footer')
  const titleEl = titleWord || title
  const isProviders = section.classList.contains('section--providers')
  const isStack = section.dataset.homeSection === 'stack'
  const scrollDistance = window.innerHeight * (isProviders ? 1.35 : isStack ? 0.95 : 1.15)

  if (label) gsap.set(label, { opacity: 0, y: 20 })
  if (titleEl) gsap.set(titleEl, { opacity: 0, scale: 0.88, y: 40 })
  if (lead) gsap.set(lead, { opacity: 0, y: 24 })
  items.forEach((item, i) => setSplitItemInitial(item, i))
  if (footer) gsap.set(footer, { opacity: 0, y: 20 })

  const tl = gsap.timeline({
    defaults: { ease: REVEAL_EASE },
    scrollTrigger: {
      trigger: section,
      start: 'top 88%',
      end: () => `+=${scrollDistance}`,
      scrub: config.scrub,
      invalidateOnRefresh: true,
      refreshPriority: 2,
      id: isProviders ? 'providers-section' : undefined,
    },
  })

  if (label) {
    tl.fromTo(label, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: REVEAL_EASE })
  }

  if (titleEl) {
    tl.fromTo(
      titleEl,
      { scale: 0.88, opacity: 0, y: 40 },
      { scale: 1, opacity: 1, y: 0, duration: 0.95, ease: REVEAL_EASE },
      '-=0.12',
    )
  }

  if (lead) {
    tl.fromTo(
      lead,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, ease: REVEAL_EASE },
      '-=0.42',
    )
  }

  items.forEach((item, i) => {
    const fromLeft = i % 2 === 0
    tl.fromTo(
      item,
      {
        opacity: 0,
        x: fromLeft ? -70 : 70,
        scale: 0.94,
        clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
        visibility: 'visible',
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        clipPath: 'inset(0 0% 0 0%)',
        duration: config.itemDuration,
        ease: REVEAL_EASE,
      },
      i === 0 ? '-=0.18' : `+=${config.gap}`,
    )
  })

  if (footer) {
    tl.fromTo(
      footer,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: REVEAL_EASE },
      `+=${config.gap}`,
    )
  }
}

function buildShowcaseSection(section: HTMLElement, config: SectionConfig) {
  const pin = section.querySelector<HTMLElement>('.home-showcase__pin')
  const intro = section.querySelector<HTMLElement>('.home-showcase__intro')
  const label = section.querySelector<HTMLElement>('.home-section__label')
  const titleWord = section.querySelector<HTMLElement>('.home-section__title-word')
  const lead = section.querySelector<HTMLElement>('.home-section__lead')
  const items = gsap.utils.toArray<HTMLElement>('.home-section__item', section)
  const footer = section.querySelector<HTMLElement>('.home-section__footer')
  const stage = section.querySelector<HTMLElement>('.home-showcase__stage')
  const isVision = section.classList.contains('section--vision')

  if (!pin || !intro) return

  gsap.set(intro, { autoAlpha: 1, visibility: 'visible' })
  gsap.set(pin, { autoAlpha: 1 })
  if (stage) gsap.set(stage, { autoAlpha: 0, visibility: 'hidden' })
  items.forEach((item, i) => setSplitItemInitial(item, i))
  if (footer) gsap.set(footer, { opacity: 0, y: 18 })

  const tl = gsap.timeline({ paused: true, defaults: { ease: REVEAL_EASE } })

  if (label) {
    tl.fromTo(label, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: REVEAL_EASE })
  }

  if (titleWord) {
    tl.fromTo(
      titleWord,
      { scale: 0.5, opacity: 0, y: 60 },
      { scale: 1, opacity: 1, y: 0, duration: 1.05, ease: REVEAL_EASE },
      '-=0.12',
    )
  }

  if (lead) {
    tl.fromTo(
      lead,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.65, ease: REVEAL_EASE },
      '-=0.42',
    )
  }

  tl.to(intro, { autoAlpha: 0, y: -32, duration: 0.55, ease: FADE_EASE }, '+=0.28')

  if (stage) {
    tl.set(stage, { autoAlpha: 1, visibility: 'visible' }, '<+=0.18')
  }

  tl.set(intro, { visibility: 'hidden', pointerEvents: 'none' })

  items.forEach((item, i) => {
    const fromLeft = i % 2 === 0
    const mediaX = fromLeft ? -90 : 90
    tl.fromTo(
      item,
      {
        opacity: 0,
        x: mediaX,
        scale: 0.94,
        clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
        visibility: 'visible',
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        clipPath: 'inset(0 0% 0 0%)',
        duration: config.itemDuration,
        ease: REVEAL_EASE,
      },
      i === 0 ? '+=0.06' : `+=${config.gap}`,
    )
  })

  if (footer) {
    tl.fromTo(
      footer,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, ease: REVEAL_EASE },
      `+=${config.gap}`,
    )
  }

  const itemCount = Math.max(items.length, 1)
  const scrollDistance =
    window.innerHeight *
    (isVision
      ? config.scrollMultiplier + itemCount * config.perItem + 0.55
      : config.scrollMultiplier + itemCount * config.perItem)

  ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => `+=${scrollDistance}`,
    pin: true,
    pinSpacing: true,
    scrub: config.scrub,
    anticipatePin: 0,
    animation: tl,
    invalidateOnRefresh: true,
    id: isVision ? 'vision-showcase' : undefined,
  })
}

function setupMarquee(root: HTMLElement) {
  const marquee = root.querySelector<HTMLElement>('.home-marquee')
  if (!marquee) return

  gsap.set(marquee, { opacity: 0, y: 20 })
  gsap.to(marquee, {
    opacity: 1,
    y: 0,
    ease: FADE_EASE,
    scrollTrigger: {
      trigger: marquee,
      start: 'top 92%',
      end: 'top 72%',
      scrub: 1.2,
    },
  })
}

export function initHomeSectionReveals(root: HTMLElement): (() => void) | undefined {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

  const showcaseSections = gsap.utils.toArray<HTMLElement>(
    '[data-home-section="showcase"]',
    root,
  )
  const mm = gsap.matchMedia()

  const runShowcase = (config: SectionConfig) => {
    showcaseSections.forEach((section) => buildShowcaseSection(section, config))
    setupMarquee(root)
  }

  mm.add('(min-width: 901px)', () => {
    runShowcase({
      itemDuration: 0.95,
      gap: 0.18,
      scrollMultiplier: 0.85,
      perItem: 0.7,
      scrub: 1.35,
    })
  })

  mm.add('(max-width: 900px)', () => {
    runShowcase({
      itemDuration: 0.8,
      gap: 0.16,
      scrollMultiplier: 0.6,
      perItem: 0.5,
      scrub: 1.2,
    })
  })

  return () => mm.revert()
}

/** Providers, testimonials, CTA — init after Services pin so ScrollTrigger positions stay correct. */
let belowFoldInitialized = false

export function initBelowFoldHomeSections(root: HTMLElement): (() => void) | undefined {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
  if (belowFoldInitialized) return undefined
  belowFoldInitialized = true

  const sections = [
    ...gsap.utils.toArray<HTMLElement>('.section--testimonials[data-home-section]', root),
    ...gsap.utils.toArray<HTMLElement>('[data-home-section="stack"]', root),
  ]
  if (sections.length === 0) {
    belowFoldInitialized = false
    return undefined
  }

  const mm = gsap.matchMedia()

  const run = (config: SectionConfig) => {
    sections.forEach((section) => {
      gsap.context(() => buildBelowFoldScrollSection(section, config), section)
    })
  }

  mm.add('(min-width: 901px)', () => {
    run({
      itemDuration: 0.95,
      gap: 0.18,
      scrollMultiplier: 0.85,
      perItem: 0.7,
      scrub: 1.35,
    })
  })

  mm.add('(max-width: 900px)', () => {
    run({
      itemDuration: 0.8,
      gap: 0.16,
      scrollMultiplier: 0.6,
      perItem: 0.5,
      scrub: 1.2,
    })
  })

  return () => {
    belowFoldInitialized = false
    mm.revert()
  }
}
