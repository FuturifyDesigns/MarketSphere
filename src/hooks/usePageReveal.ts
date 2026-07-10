import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function usePageReveal(
  pageRef: RefObject<HTMLElement | null>,
  selector = '.page-reveal',
) {
  useEffect(() => {
    const root = pageRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector)).forEach((el) => {
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
    }, root)

    return () => ctx.revert()
  }, [pageRef, selector])
}
