import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'

gsap.registerPlugin(ScrollTrigger)

const HERO_CHILD_SELECTORS = [
  '.page-enter-hero > *',
  '.about-hero__content > *',
  '.services-hero__content > *',
  '.contact-hero__content > *',
  '.faq-hero__content > *',
  '.page-hero > .container > *',
].join(', ')

const SCROLL_REVEAL_SELECTORS = '.page-reveal, .about-reveal'

export function runPageEnterAnimation(root: HTMLElement, isHome: boolean) {
  if (prefersReducedMotion()) {
    gsap.set(root, { opacity: 1, y: 0, clearProps: 'all' })
    return () => {}
  }

  const ctx = gsap.context(() => {
    gsap.set(root, { opacity: 1 })

    const pageTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    pageTl.fromTo(
      root,
      { opacity: 0, y: isHome ? 12 : 28 },
      { opacity: 1, y: 0, duration: isHome ? 0.5 : 0.7 },
    )

    if (!isHome) {
      const heroItems = root.querySelectorAll(HERO_CHILD_SELECTORS)
      if (heroItems.length) {
        pageTl.from(
          heroItems,
          {
            y: 36,
            opacity: 0,
            duration: 0.85,
            stagger: 0.09,
            ease: 'power4.out',
          },
          0.12,
        )
      }

      const heroAside = root.querySelectorAll(
        '.about-hero__card, .services-hero__stats, .contact-quick, .faq-hero__card',
      )
      if (heroAside.length) {
        pageTl.from(
          heroAside,
          {
            y: 28,
            opacity: 0,
            scale: 0.98,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
          },
          0.28,
        )
      }
    }

    gsap.utils.toArray<HTMLElement>(root.querySelectorAll(SCROLL_REVEAL_SELECTORS)).forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      })
    })

    const sections = !isHome ? root.querySelectorAll('.section:not(:first-of-type)') : []
    sections.forEach((section) => {
      gsap.from(section, {
        y: 24,
        opacity: 0,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 92%',
          once: true,
        },
      })
    })
  }, root)

  return () => ctx.revert()
}

export function runAuthPageEnter(root: HTMLElement) {
  if (prefersReducedMotion()) return () => {}

  const ctx = gsap.context(() => {
    gsap.fromTo(
      root,
      { opacity: 0, y: 32, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out' },
    )
    gsap.from(root.querySelectorAll('.auth-card > *'), {
      y: 24,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power4.out',
      delay: 0.15,
    })
  }, root)

  return () => ctx.revert()
}
