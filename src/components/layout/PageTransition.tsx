import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { runPageEnterAnimation } from '../../animations/pageEnter'
import { onIntroComplete } from '../../lib/intro'
import './PageTransition.css'

export function PageTransition() {
  const location = useLocation()
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const pageRoot = wrap?.firstElementChild as HTMLElement | null
    if (!pageRoot) return

    let cleanupEnter = () => {}
    let cancelled = false

    const start = () => {
      if (cancelled) return
      cleanupEnter = runPageEnterAnimation(
        pageRoot,
        location.pathname === '/' || location.pathname === '',
      )
      gsap.fromTo(
        '.navbar',
        { y: -12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.05 },
      )
    }

    const removeIntroListener = onIntroComplete(start)

    return () => {
      cancelled = true
      removeIntroListener()
      cleanupEnter()
    }
  }, [location.pathname])

  return (
    <div ref={wrapRef} className="page-transition" key={location.pathname}>
      <Outlet />
    </div>
  )
}
