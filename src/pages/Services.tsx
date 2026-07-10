import { motion } from 'framer-motion'
import { Building, GraduationCap, Lightbulb, Megaphone, Users } from 'lucide-react'
import { SERVICES } from '../lib/constants'
import { Button } from '../components/ui/Button'
import './Services.css'

const ICONS: Record<string, React.ReactNode> = {
  users: <Users size={24} />,
  'graduation-cap': <GraduationCap size={24} />,
  megaphone: <Megaphone size={24} />,
  building: <Building size={24} />,
  lightbulb: <Lightbulb size={24} />,
}

export function Services() {
  return (
    <div className="page services-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Our Services</span>
          <h1>Professional solutions across Botswana</h1>
          <p className="lead">
            From youth empowerment to real estate consultancy — Market Sphere Group delivers
            timely, professional services that meet the needs of clients and communities nationwide.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="services-list">
            {SERVICES.map((service, i) => (
              <motion.article
                key={service.title}
                className="service-detail"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="service-detail__icon">
                  {ICONS[service.icon] || <Lightbulb size={24} />}
                </div>
                <div>
                  <h2>{service.title}</h2>
                  <p>{service.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container services-cta">
          <h2>Looking for a specific service?</h2>
          <p>Browse our network of verified providers or list your own business on MarketSphere.</p>
          <div className="services-cta__actions">
            <Button to="/browse" size="lg">Browse Providers</Button>
            <Button to="/register?role=provider" variant="secondary" size="lg">Become a Provider</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
