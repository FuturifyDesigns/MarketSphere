import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { flushScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const REVEAL_EASE = 'power2.out'

let activeCleanup: (() => void) | undefined

export function initProvidersReveal(section: HTMLElement): (() => void) | undefined {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

  activeCleanup?.()
  ScrollTrigger.getById('providers-reveal')?.kill()

  const ctx = gsap.context(() => {
    const label = section.querySelector<HTMLElement>('.home-section__label')
    const titleWord = section.querySelector<HTMLElement>('.home-section__title-word')
    const lead = section.querySelector<HTMLElement>('.home-section__lead')
    const items = gsap.utils.toArray<HTMLElement>('.home-section__item', section)
    const footer = section.querySelector<HTMLElement>('.home-section__footer')

    const hide = (el: HTMLElement | null, y: number, scale = 1) => {
      if (el) gsap.set(el, { opacity: 0, y, scale })
    }

    hide(label, 28)
    hide(titleWord, 40, 0.9)
    hide(lead, 24)
    items.forEach((item, i) => hide(item, 36 + i * 6, 0.96))
    hide(footer, 20)

    const tl = gsap.timeline({
      defaults: { ease: REVEAL_EASE },
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: () => `+=${window.innerHeight * 1.15}`,
        scrub: 1.35,
        invalidateOnRefresh: true,
        refreshPriority: 3,
        id: 'providers-reveal',
      },
    })

    if (label) {
      tl.fromTo(label, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.5 })
    }

    if (titleWord) {
      tl.fromTo(
        titleWord,
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.85 },
        '-=0.12',
      )
    }

    if (lead) {
      tl.fromTo(lead, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55 }, '-=0.38')
    }

    items.forEach((item, i) => {
      tl.fromTo(
        item,
        { opacity: 0, y: 36 + i * 6, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.75 },
        i === 0 ? '-=0.1' : '+=0.14',
      )
    })

    if (footer) {
      tl.fromTo(footer, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '+=0.12')
    }
  }, section)

  const cleanup = () => {
    ctx.revert()
    if (activeCleanup === cleanup) activeCleanup = undefined
  }

  activeCleanup = cleanup

  requestAnimationFrame(() => {
    flushScrollRefresh()
  })

  return cleanup
}
