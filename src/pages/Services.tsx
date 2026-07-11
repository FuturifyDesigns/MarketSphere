import { type ReactNode } from 'react'
import { ArrowRight, Building, GraduationCap, Lightbulb, Megaphone, Users } from 'lucide-react'
import { SERVICES, COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import './Services.css'

const ICONS: Record<string, ReactNode> = {
  users: <Users size={26} />,
  'graduation-cap': <GraduationCap size={26} />,
  megaphone: <Megaphone size={26} />,
  building: <Building size={26} />,
  lightbulb: <Lightbulb size={26} />,
}

export function Services() {
  return (
    <div className="page services-page">
      <section className="services-hero">
        <div className="container services-hero__inner">
          <div className="services-hero__content page-enter-hero">
            <span className="section-label">Our Services</span>
            <h1 className="display-xl">
              Professional solutions<br />
              <em className="text-gold">across Botswana</em>
            </h1>
            <p className="lead">
              From youth empowerment to real estate consultancy — Market Sphere Group delivers
              timely, professional services that meet the needs of clients and communities nationwide.
            </p>
          </div>
          <div className="services-hero__stats bento-card page-reveal">
            <div>
              <span className="services-hero__stat-num">5</span>
              <span className="services-hero__stat-label">Core service lines</span>
            </div>
            <div>
              <span className="services-hero__stat-num">SADC</span>
              <span className="services-hero__stat-label">Regional reach</span>
            </div>
            <div>
              <span className="services-hero__stat-num">24/7</span>
              <span className="services-hero__stat-label">Platform access</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header page-reveal">
            <span className="section-label">What We Offer</span>
            <h2 className="display-lg">Services built for impact</h2>
            <p>Comprehensive professional and socio-economic solutions tailored to Botswana's needs.</p>
          </div>
          <div className="services-bento">
            {SERVICES.map((service, i) => (
              <article
                key={service.title}
                className={`service-card bento-card page-reveal ${i === 0 ? 'service-card--featured' : ''}`}
              >
                <span className="service-card__index">0{i + 1}</span>
                <div className="service-card__icon">
                  {ICONS[service.icon] || <Lightbulb size={26} />}
                </div>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--accent">
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
