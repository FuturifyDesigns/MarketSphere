import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { COMPANY } from '../../lib/constants'
import {
  dispatchIntroComplete,
  hasSeenIntro,
  markIntroSeen,
  prefersReducedMotion,
} from '../../lib/intro'
import './SiteIntro.css'

export function SiteIntro() {
  const [visible, setVisible] = useState(() => !hasSeenIntro())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) {
      dispatchIntroComplete()
      return
    }

    const finish = () => {
      markIntroSeen()
      document.body.classList.remove('intro-active')
      dispatchIntroComplete()
      setVisible(false)
    }

    if (prefersReducedMotion()) {
      finish()
      return
    }

    document.body.classList.add('intro-active')
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: finish,
      })

      tl.set(root, { autoAlpha: 1 })
        .from('.site-intro__glow', { opacity: 0, scale: 0.6, duration: 1 })
        .from('.site-intro__logo-wrap', { scale: 0.5, opacity: 0, duration: 0.9, ease: 'back.out(1.4)' }, '-=0.7')
        .from('.site-intro__ring', { scale: 0.7, opacity: 0, duration: 0.7 }, '-=0.6')
        .from('.site-intro__brand', { y: 48, opacity: 0, duration: 0.8, ease: 'power4.out' }, '-=0.35')
        .from('.site-intro__line', { scaleX: 0, duration: 0.65, ease: 'power2.inOut' }, '-=0.25')
        .from('.site-intro__tagline', { y: 20, opacity: 0, duration: 0.55 }, '-=0.15')
        .to('.site-intro__progress-bar', { scaleX: 1, duration: 1.4, ease: 'power1.inOut' }, '-=0.1')

      const counter = root.querySelector('.site-intro__counter')
      if (counter) {
        const counterState = { val: 0 }
        tl.to(
          counterState,
          {
            val: 100,
            duration: 1.4,
            ease: 'power1.inOut',
            onUpdate: () => {
              counter.textContent = String(Math.round(counterState.val))
            },
          },
          '<',
        )
      }

      tl.to('.site-intro__content', { opacity: 0, y: -24, duration: 0.45, ease: 'power2.in' }, '+=0.15')
        .to('.site-intro__curtain-top', { yPercent: -100, duration: 1, ease: 'power4.inOut' }, '-=0.1')
        .to('.site-intro__curtain-bottom', { yPercent: 100, duration: 1, ease: 'power4.inOut' }, '<')
        .to(root, { autoAlpha: 0, duration: 0.2 }, '-=0.15')
    }, root)

    return () => {
      ctx.revert()
      document.body.classList.remove('intro-active')
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="site-intro" ref={rootRef} aria-hidden="true">
      <div className="site-intro__bg" />
      <div className="site-intro__glow" />
      <div className="site-intro__content">
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
      <div className="site-intro__curtain site-intro__curtain-top" />
      <div className="site-intro__curtain site-intro__curtain-bottom" />
    </div>
  )
}
