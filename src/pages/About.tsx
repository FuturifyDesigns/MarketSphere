import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { AboutCompanyTree } from '../components/about/AboutCompanyTree'
import { initAboutTreeAnimation } from '../animations/aboutTreeReveal'
import { onIntroComplete } from '../lib/intro'
import './About.css'

export function About() {
  const treeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const tree = treeRef.current
    if (!tree) return

    let cleanup: (() => void) | undefined

    const init = () => {
      cleanup?.()
      cleanup = initAboutTreeAnimation(tree)
    }

    const removeIntroListener = onIntroComplete(init)
    const failsafe = window.setTimeout(init, 4200)

    return () => {
      window.clearTimeout(failsafe)
      removeIntroListener()
      cleanup?.()
    }
  }, [])

  return (
    <div className="page about-page">
      <section className="about-hero">
        <div className="container about-hero__inner">
          <div className="about-hero__content page-enter-hero">
            <span className="section-label">About Us</span>
            <h1 className="display-xl">
              Building Botswana&apos;s<br />
              <em className="text-gold">service marketplace</em>
            </h1>
            <p className="lead">{COMPANY.tagline}</p>
            <Button to="/contact" size="lg">
              Work With Us <ArrowRight size={16} />
            </Button>
          </div>
          <div className="about-hero__logo-wrap about-reveal" aria-hidden="true">
            <div className="about-hero__logo-glow" />
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              className="about-hero__logo"
            />
          </div>
        </div>
      </section>

      <AboutCompanyTree ref={treeRef} />
    </div>
  )
}
