import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis } from '../hooks/useLenis'

/** Jump to the top of the page — works with Lenis or native scroll. */
export function scrollToTop(immediate = true) {
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(0, { immediate, force: true })
  }

  window.scrollTo({ top: 0, left: 0, behavior: immediate ? 'auto' : 'smooth' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

/** Reset scroll position and GSAP scroll memory when the route changes. */
export function resetScrollOnRouteChange() {
  scrollToTop(true)

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }

  ScrollTrigger.clearScrollMemory?.()
}
