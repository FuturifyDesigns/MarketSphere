import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { LOGO_PATH } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { AboutCompanyTree } from '../components/about/AboutCompanyTree'
import { StaffShowcase } from '../components/about/StaffShowcase'
import { EditableSection } from '../components/cms/EditableSection'
import { EditableText } from '../components/cms/EditableText'
import { CmsExtraSections } from '../components/cms/CmsExtraSections'
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
      <EditableSection id="about-hero" label="Hero" className="about-hero">
        <div className="container about-hero__inner">
          <div className="about-hero__content page-enter-hero">
            <EditableText contentKey="about" path="hero.eyebrow" as="span" className="section-label" />
            <h1 className="display-xl">
              <EditableText contentKey="about" path="hero.title" as="span" />
              <br />
              <em className="text-gold">
                <EditableText contentKey="about" path="hero.titleEmphasis" as="span" />
              </em>
            </h1>
            <EditableText contentKey="about" path="hero.lead" as="p" className="lead" />
            <Button to="/contact" size="lg">
              Work With Us <ArrowRight size={16} />
            </Button>
          </div>
          <div className="about-hero__logo-wrap about-reveal" aria-hidden="true">
            <div className="about-hero__logo-glow" />
            <img
              src={`${import.meta.env.BASE_URL}${LOGO_PATH}`}
              alt=""
              className="about-hero__logo"
            />
          </div>
        </div>
      </EditableSection>

      <EditableSection id="about-company" label="Company profile" as="div">
        <AboutCompanyTree ref={treeRef} />
      </EditableSection>

      <EditableSection id="about-staff" label="Leadership team" as="div">
        <StaffShowcase />
      </EditableSection>

      <EditableSection id="about-extra" label="Extra sections" as="div">
        <div className="container">
          <CmsExtraSections contentKey="about" />
        </div>
      </EditableSection>
    </div>
  )
}
