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
  const apply = () => {
    const lenis = getLenis()
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true })
      lenis.resize()
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }

  apply()
  requestAnimationFrame(apply)
  window.setTimeout(apply, 0)
  window.setTimeout(apply, 100)
  window.setTimeout(apply, 300)

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }

  ScrollTrigger.clearScrollMemory?.()
  ScrollTrigger.refresh()
}
