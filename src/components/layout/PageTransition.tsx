import { useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { runPageEnterAnimation } from '../../animations/pageEnter'
import { onIntroComplete, isIntroComplete } from '../../lib/intro'
import { scheduleScrollRefresh } from '../../lib/scrollRefresh'
import { resetScrollOnRouteChange } from '../../lib/scrollToTop'
import './PageTransition.css'

gsap.registerPlugin(ScrollTrigger)

export function PageTransition() {
  const location = useLocation()
  const wrapRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    resetScrollOnRouteChange()
  }, [location.pathname])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let cleanupEnter = () => {}
    let cancelled = false

    const start = () => {
      if (cancelled) return

      const pageRoot = wrap.firstElementChild as HTMLElement | null
      if (!pageRoot) return

      cleanupEnter()

      const isHome = location.pathname === '/' || location.pathname === ''

      window.requestAnimationFrame(() => {
        if (cancelled) return

        cleanupEnter = runPageEnterAnimation(pageRoot, isHome)

        if (!isHome) {
          gsap.fromTo(
            '.navbar',
            { y: -12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.05 },
          )
        }

        scheduleScrollRefresh()
      })
    }

    const removeIntroListener = onIntroComplete(start)
    const failsafe = isIntroComplete() ? undefined : window.setTimeout(start, 4000)

    return () => {
      cancelled = true
      if (failsafe !== undefined) window.clearTimeout(failsafe)
      removeIntroListener()
      cleanupEnter()
    }
  }, [location.pathname])

  return (
    <div ref={wrapRef} className="page-transition">
      <Outlet />
    </div>
  )
}
