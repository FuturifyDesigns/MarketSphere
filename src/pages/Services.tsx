import { ArrowRight } from 'lucide-react'
import { EditableSection } from '../components/cms/EditableSection'
import { EditableText } from '../components/cms/EditableText'
import { EditableButton } from '../components/cms/EditableButton'
import { CmsExtraSections } from '../components/cms/CmsExtraSections'
import { useSiteContent } from '../context/SiteContentContext'
import { ServicesPageShowcase } from '../components/services/ServicesPageShowcase'
import './Services.css'

export function Services() {
  const { getBlock } = useSiteContent()
  const services = getBlock<{
    cta: {
      eyebrow: string
      title: string
      body: string
      primaryLabel: string
      primaryHref: string
      secondaryLabel: string
      secondaryHref: string
    }
  }>('services')
  const cta = services.cta

  return (
    <div className="page services-page">
      <EditableSection id="services-hero" label="Hero" className="services-hero">
        <div className="container services-hero__inner page-enter-hero">
          <EditableText contentKey="services" path="hero.eyebrow" as="span" className="section-label" />
          <h1 className="display-xl">
            <EditableText contentKey="services" path="hero.title" as="span" />
            <br />
            <em className="text-gold">
              <EditableText contentKey="services" path="hero.titleEmphasis" as="span" />
            </em>
          </h1>
          <EditableText contentKey="services" path="hero.lead" as="p" className="lead services-hero__lead" multiline />
          <EditableText contentKey="services" path="hero.hint" as="p" className="services-hero__hint" />
        </div>
      </EditableSection>

      <EditableSection id="services-showcase" label="Services showcase" as="div">
        <ServicesPageShowcase />
      </EditableSection>

      <EditableSection id="services-cta" label="Bottom CTA" className="section services-page-cta">
        <div className="container">
          <div className="cta-panel bento-card page-reveal">
            <EditableText contentKey="services" path="cta.eyebrow" as="span" className="section-label" />
            <EditableText contentKey="services" path="cta.title" as="h2" className="display-lg" />
            <EditableText contentKey="services" path="cta.body" as="p" multiline />
            <div className="cta-panel__actions">
              <EditableButton
                contentKey="services"
                labelPath="cta.primaryLabel"
                hrefPath="cta.primaryHref"
                to={cta?.primaryHref || '/browse'}
                size="lg"
              >
                <ArrowRight size={16} />
              </EditableButton>
              <EditableButton
                contentKey="services"
                labelPath="cta.secondaryLabel"
                hrefPath="cta.secondaryHref"
                to={cta?.secondaryHref || '/register?role=provider'}
                variant="secondary"
                size="lg"
              />
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="services-extra" label="Extra sections" as="div">
        <div className="container">
          <CmsExtraSections contentKey="services" />
        </div>
      </EditableSection>
    </div>
  )
}
