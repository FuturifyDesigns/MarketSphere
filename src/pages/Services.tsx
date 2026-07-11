import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { COMPANY } from '../lib/constants'
import { preloadServiceVideos, releaseServiceVideoPreload } from '../lib/serviceVideoPreload'
import { Button } from '../components/ui/Button'
import { ServicesPageShowcase } from '../components/services/ServicesPageShowcase'
import './Services.css'

export function Services() {
  useEffect(() => {
    void preloadServiceVideos()
    return () => releaseServiceVideoPreload()
  }, [])
  return (
    <div className="page services-page">
      <section className="services-hero">
        <div className="container services-hero__inner page-enter-hero">
          <span className="section-label">Our Services</span>
          <h1 className="display-xl">
            Professional solutions<br />
            <em className="text-gold">across Botswana</em>
          </h1>
          <p className="lead services-hero__lead">
            From youth empowerment to real estate consultancy — {COMPANY.shortName} delivers
            timely, professional services that meet the needs of clients and communities nationwide.
          </p>
          <p className="services-hero__hint">Scroll to explore each service line</p>
        </div>
      </section>

      <ServicesPageShowcase />

      <section className="section services-page-cta">
        <div className="container">
          <div className="cta-panel bento-card page-reveal">
            <span className="section-label">Get Started</span>
            <h2 className="display-lg">Looking for a specific service?</h2>
            <p>Browse our network of verified providers or list your own business with {COMPANY.shortName}.</p>
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
