import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const HERO_CHILD_SELECTORS = [
  '.page-enter-hero > *',
  '.about-hero__content > *',
  '.services-hero__inner > *',
  '.browse-hero__inner > *',
  '.contact-hero__content > *',
  '.faq-hero__content > *',
  '.page-hero > .container > *',
].join(', ')

const SCROLL_REVEAL_SELECTORS = '.page-reveal, .about-reveal'

export function runPageEnterAnimation(root: HTMLElement, isHome: boolean) {
  if (prefersReducedMotion()) {
    gsap.set(root, { opacity: 1, y: 0, clearProps: 'transform,opacity' })
    return () => {}
  }

  if (isHome) {
    gsap.set(root, { opacity: 1, y: 0, visibility: 'visible', clearProps: 'transform,opacity' })
    return () => {}
  }

  const ctx = gsap.context(() => {
    gsap.set(root, { opacity: 1, visibility: 'visible' })

    const pageTl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => scheduleScrollRefresh(),
    })

    pageTl.fromTo(
      root,
      { opacity: 0 },
      { opacity: 1, duration: 0.45, clearProps: 'opacity' },
    )

    const heroItems = root.querySelectorAll(HERO_CHILD_SELECTORS)
    if (heroItems.length) {
      pageTl.fromTo(
        heroItems,
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.07,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        0.08,
      )
    }

    const heroAside = root.querySelectorAll(
      '.about-hero__logo-wrap, .contact-quick, .faq-hero__card',
    )
    if (heroAside.length) {
      pageTl.fromTo(
        heroAside,
        { y: 28, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        0.28,
      )
    }

    gsap.utils
      .toArray<HTMLElement>(root.querySelectorAll(SCROLL_REVEAL_SELECTORS))
      .filter((el) => !el.closest('.about-tree, .svc-page'))
      .forEach((el) => {
      gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
            fastScrollEnd: true,
          },
        },
      )
    })

    root.querySelectorAll('.section:not(:first-of-type)').forEach((section) => {
      if (section.closest('.about-tree')) return
        gsap.fromTo(
          section,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: section,
              start: 'top 92%',
              once: true,
              fastScrollEnd: true,
            },
          },
        )
      })
  }, root)

  return () => ctx.revert()
}

export function runAuthPageEnter(root: HTMLElement) {
  if (prefersReducedMotion()) return () => {}

  const isAuthPage = root.classList.contains('auth-page')

  if (isAuthPage) {
    return () => {}
  }

  const ctx = gsap.context(() => {
    gsap.set(root, { opacity: 1, clearProps: 'transform,opacity' })

    const targets = root.querySelectorAll('.auth-gate__stack, .auth-gate__card')
    if (targets.length) {
      gsap.fromTo(
        targets,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power4.out',
          delay: 0.05,
          clearProps: 'transform,opacity',
        },
      )
    }
  }, root)

  return () => ctx.revert()
}
