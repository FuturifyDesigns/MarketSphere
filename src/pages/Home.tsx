import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Globe, Shield, Users } from 'lucide-react'
import { HeroDemo } from '../components/hero/HeroDemo'
import { ProviderCard } from '../components/ui/ProviderCard'
import { Button } from '../components/ui/Button'
import { COMPANY, SERVICES } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { Provider, Testimonial } from '../lib/types'
import { useState } from 'react'
import './Home.css'

gsap.registerPlugin(ScrollTrigger)

export function Home() {
  const storyRef = useRef<HTMLDivElement>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    supabase
      .from('providers')
      .select('*')
      .eq('status', 'approved')
      .limit(3)
      .then(({ data }) => setProviders(data || []))

    supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .limit(4)
      .then(({ data }) => setTestimonials(data || []))
  }, [])

  useEffect(() => {
    const el = storyRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress
          document.documentElement.style.setProperty('--sky-progress', String(p))
          document.documentElement.setAttribute(
            'data-theme',
            p > 0.5 ? 'night' : 'day'
          )
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div className="home" ref={storyRef}>
      {/* Hero — Dawn */}
      <section className="home-hero section--day">
        <div className="container home-hero__grid">
          <motion.div
            className="home-hero__text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="eyebrow">Market Sphere Group · Botswana</span>
            <h1>
              Connect with trusted<br />
              <em>service providers</em><br />
              across the nation
            </h1>
            <p className="lead">
              {COMPANY.overview.slice(0, 160)}…
            </p>
            <div className="home-hero__actions">
              <Button to="/browse" size="lg">
                Find Providers <ArrowRight size={16} />
              </Button>
              <Button to="/register?role=provider" variant="secondary" size="lg">
                List Your Business
              </Button>
            </div>
          </motion.div>
          <motion.div
            className="home-hero__demo"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <HeroDemo />
          </motion.div>
        </div>
      </section>

      {/* Vision — Midday */}
      <section className="home-vision section--mid">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Our Vision</span>
            <h2>{COMPANY.mission}</h2>
            <p>{COMPANY.vision}</p>
          </div>
          <div className="home-stats">
            <div className="home-stat">
              <Globe size={24} />
              <strong>{COMPANY.operationalArea}</strong>
              <span>Operational reach</span>
            </div>
            <div className="home-stat">
              <Users size={24} />
              <strong>9+</strong>
              <span>Service categories</span>
            </div>
            <div className="home-stat">
              <Shield size={24} />
              <strong>Verified</strong>
              <span>Provider network</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services — Afternoon */}
      <section className="home-services section--warm">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">What We Offer</span>
            <h2>Services that empower Botswana</h2>
          </div>
          <div className="home-services__grid">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                className="service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="section-cta">
            <Button to="/services" variant="secondary">View All Services</Button>
          </div>
        </div>
      </section>

      {/* Providers — Dusk */}
      <section className="home-providers section--dusk">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Our Network</span>
            <h2>Featured service providers</h2>
            <p>Browse verified professionals ready to help you master your field.</p>
          </div>
          {providers.length > 0 ? (
            <div className="providers-grid">
              {providers.map((p, i) => (
                <ProviderCard key={p.id} provider={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Provider listings coming soon. Be the first to <Link to="/register?role=provider">join our network</Link>.</p>
            </div>
          )}
          <div className="section-cta">
            <Button to="/browse">Browse All Providers</Button>
          </div>
        </div>
      </section>

      {/* Testimonials — Night */}
      <section className="home-testimonials section--night">
        <div className="container">
          <div className="section-header section-header--light">
            <span className="eyebrow">Client Stories</span>
            <h2>Satisfied clients across Botswana</h2>
          </div>
          <div className="testimonials-grid">
            {(testimonials.length > 0 ? testimonials : [
              { id: '1', client_name: 'Thabo M.', content: 'Market Sphere Group helped me find a reliable tutor for my children. Professional and responsive throughout.', service_type: 'Academic Tuition', rating: 5, approved: true },
              { id: '2', client_name: 'Keabetswe R.', content: 'Their real estate consultancy made buying our first home in Gaborone straightforward and stress-free.', service_type: 'Real Estate', rating: 5, approved: true },
            ]).map((t, i) => (
              <motion.blockquote
                key={t.id}
                className="testimonial-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p>"{t.content}"</p>
                <footer>
                  <strong>{t.client_name}</strong>
                  {t.service_type && <span>{t.service_type}</span>}
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta section--night">
        <div className="container home-cta__inner">
          <h2>Ready to get started?</h2>
          <p>Join MarketSphere today — whether you're looking for services or offering them.</p>
          <div className="home-cta__actions">
            <Button to="/register" size="lg">Create Account</Button>
            <Button to="/contact" variant="secondary" size="lg">Contact Us</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
