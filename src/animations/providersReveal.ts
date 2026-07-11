import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { flushScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const REVEAL_EASE = 'power2.out'

export function initProvidersReveal(section: HTMLElement): (() => void) | undefined {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

  const ctx = gsap.context(() => {
    const label = section.querySelector<HTMLElement>('.home-section__label')
    const titleWord = section.querySelector<HTMLElement>('.home-section__title-word')
    const lead = section.querySelector<HTMLElement>('.home-section__lead')
    const items = gsap.utils.toArray<HTMLElement>('.home-section__item', section)
    const footer = section.querySelector<HTMLElement>('.home-section__footer')

    if (label) gsap.set(label, { opacity: 0, y: 24 })
    if (titleWord) gsap.set(titleWord, { opacity: 0, scale: 0.88, y: 44 })
    if (lead) gsap.set(lead, { opacity: 0, y: 26 })
    items.forEach((item, i) => {
      const fromLeft = i % 2 === 0
      gsap.set(item, {
        opacity: 0,
        x: fromLeft ? -80 : 80,
        scale: 0.94,
        clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
      })
    })
    if (footer) gsap.set(footer, { opacity: 0, y: 22 })

    const tl = gsap.timeline({
      defaults: { ease: REVEAL_EASE },
      scrollTrigger: {
        trigger: section,
        start: 'top 95%',
        end: 'top 22%',
        scrub: 1.35,
        invalidateOnRefresh: true,
        refreshPriority: 2,
        id: 'providers-reveal',
      },
    })

    if (label) {
      tl.fromTo(label, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45 })
    }

    if (titleWord) {
      tl.fromTo(
        titleWord,
        { opacity: 0, scale: 0.88, y: 44 },
        { opacity: 1, scale: 1, y: 0, duration: 0.9 },
        '-=0.1',
      )
    }

    if (lead) {
      tl.fromTo(lead, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.55 }, '-=0.4')
    }

    items.forEach((item, i) => {
      const fromLeft = i % 2 === 0
      tl.fromTo(
        item,
        {
          opacity: 0,
          x: fromLeft ? -80 : 80,
          scale: 0.94,
          clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          clipPath: 'inset(0 0% 0 0%)',
          duration: 0.85,
        },
        i === 0 ? '-=0.12' : '+=0.16',
      )
    })

    if (footer) {
      tl.fromTo(footer, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5 }, '+=0.14')
    }
  }, section)

  flushScrollRefresh()

  return () => ctx.revert()
}
