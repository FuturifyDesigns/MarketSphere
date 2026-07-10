import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { COMPANY } from '../../lib/constants'
import {
  dispatchIntroComplete,
  hasSeenIntro,
  markIntroSeen,
  prefersReducedMotion,
  resetIntroActiveClass,
} from '../../lib/intro'
import './SiteIntro.css'

const INTRO_FAILSAFE_MS = 3800

export function SiteIntro() {
  const [done, setDone] = useState(() => hasSeenIntro())
  const rootRef = useRef<HTMLDivElement>(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    resetIntroActiveClass()

    const finish = () => {
      if (finishedRef.current) return
      finishedRef.current = true
      markIntroSeen()
      resetIntroActiveClass()
      dispatchIntroComplete()
      setDone(true)
    }

    if (done || prefersReducedMotion()) {
      finish()
      return
    }

    const root = rootRef.current
    if (!root) {
      finish()
      return
    }

    document.body.classList.add('intro-active')
    const failsafe = window.setTimeout(finish, INTRO_FAILSAFE_MS)

    const ctx = gsap.context(() => {
      gsap.set(root, { opacity: 1, visibility: 'visible' })

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          window.clearTimeout(failsafe)
          finish()
        },
      })

      tl.fromTo(
        '.site-intro__glow',
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.8 },
      )
        .fromTo(
          '.site-intro__logo-wrap',
          { scale: 0.55, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.85, ease: 'back.out(1.5)' },
          '-=0.5',
        )
        .fromTo(
          '.site-intro__brand',
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power4.out' },
          '-=0.35',
        )
        .fromTo(
          '.site-intro__line',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.55, ease: 'power2.inOut' },
          '-=0.25',
        )
        .fromTo(
          '.site-intro__tagline',
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          '-=0.15',
        )
        .fromTo(
          '.site-intro__progress-bar',
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: 'power1.inOut' },
          '-=0.1',
        )

      const counter = root.querySelector('.site-intro__counter')
      if (counter) {
        const counterState = { val: 0 }
        tl.to(
          counterState,
          {
            val: 100,
            duration: 1.1,
            ease: 'power1.inOut',
            onUpdate: () => {
              counter.textContent = String(Math.round(counterState.val))
            },
          },
          '<',
        )
      }

      tl.to('.site-intro__panel', { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, '+=0.1')
        .to(root, { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.1')
    }, root)

    return () => {
      window.clearTimeout(failsafe)
      ctx.revert()
      resetIntroActiveClass()
    }
  }, [done])

  if (done) return null

  return (
    <div className="site-intro" ref={rootRef} aria-hidden="true">
      <div className="site-intro__bg" />
      <div className="site-intro__glow" />
      <div className="site-intro__panel">
        <div className="site-intro__logo-wrap">
          <div className="site-intro__ring" />
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            className="site-intro__logo"
          />
        </div>
        <h1 className="site-intro__brand">{COMPANY.shortName}</h1>
        <div className="site-intro__line" />
        <p className="site-intro__tagline">{COMPANY.tagline}</p>
        <div className="site-intro__progress">
          <div className="site-intro__progress-bar" />
        </div>
        <span className="site-intro__counter">0</span>
      </div>
    </div>
  )
}
