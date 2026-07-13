import { ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EditableText } from '../components/cms/EditableText'
import { useSiteContent } from '../context/SiteContentContext'
import { ServicesPageShowcase } from '../components/services/ServicesPageShowcase'
import './Services.css'

export function Services() {
  const { getBlock } = useSiteContent()
  const company = getBlock<{ shortName: string }>('company')

  return (
    <div className="page services-page">
      <section className="services-hero">
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
      </section>

      <ServicesPageShowcase />

      <section className="section services-page-cta">
        <div className="container">
          <div className="cta-panel bento-card page-reveal">
            <span className="section-label">Get Started</span>
            <h2 className="display-lg">Looking for a specific service?</h2>
            <p>Browse our network of verified providers or list your own business with {company.shortName}.</p>
            <div className="cta-panel__actions">
              <Button to="/browse" size="lg">
                Browse Providers <ArrowRight size={16} />
              </Button>
              <Button to="/register?role=provider" variant="secondary" size="lg">
                Become a Provider
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
