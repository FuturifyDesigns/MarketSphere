import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowDown, Building, GraduationCap, Lightbulb, Megaphone, Users } from 'lucide-react'
import { SkyBackground } from '../components/home/SkyBackground'
import { Marquee } from '../components/home/Marquee'
import { HeroDemo } from '../components/hero/HeroDemo'
import { ProviderCard } from '../components/ui/ProviderCard'
import { Button } from '../components/ui/Button'
import { COMPANY, SERVICES } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { Provider, Testimonial } from '../lib/types'
import './Home.css'

gsap.registerPlugin(ScrollTrigger)

const SERVICE_ICONS: Record<string, typeof Users> = {
  users: Users,
  'graduation-cap': GraduationCap,
  megaphone: Megaphone,
  building: Building,
  lightbulb: Lightbulb,
}

const MARQUEE_ITEMS = [
  'Youth Empowerment',
  'Real Estate',
  'Academic Tuition',
  'Entrepreneurship',
  'Platform Marketing',
  'Botswana',
  'SADC',
  'Master Your Field',
]

export function Home() {
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const servicesPinRef = useRef<HTMLElement>(null)
  const servicesTrackRef = useRef<HTMLDivElement>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    supabase.from('providers').select('*').eq('status', 'approved').limit(3)
      .then(({ data }) => setProviders(data || []))
    supabase.from('testimonials').select('*').eq('approved', true).limit(4)
      .then(({ data }) => setTestimonials(data || []))
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      // Day → night sky scrub
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        onUpdate: (self) => {
          const p = self.progress
          document.documentElement.style.setProperty('--sky-progress', String(p))
          document.documentElement.setAttribute('data-theme', p > 0.55 ? 'night' : 'day')
        },
      })

      // Hero entrance
      const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      heroTl
        .from('.hero__line', { y: 80, opacity: 0, duration: 1.1, stagger: 0.12 })
        .from('.hero__sub', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.hero__actions', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4')
        .from('.hero__visual', { scale: 0.92, opacity: 0, duration: 1 }, '-=0.8')
        .from('.hero__scroll-hint', { opacity: 0, duration: 0.6 }, '-=0.3')

      // Pinned hero parallax
      if (heroRef.current) {
        gsap.to('.hero__content', {
          y: -80,
          opacity: 0.3,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        })
        gsap.to('.hero__visual', {
          y: -40,
          scale: 0.95,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        })
      }

      // Reveal on scroll
      gsap.utils.toArray<HTMLElement>('.reveal-item').forEach((el) => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        })
      })

      // Stats counter feel
      gsap.from('.stat-card', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.stats-row',
          start: 'top 80%',
        },
      })

      // Horizontal services scroll (Lusion-style)
      const track = servicesTrackRef.current
      const pin = servicesPinRef.current
      if (track && pin) {
        const getScroll = () => track.scrollWidth - window.innerWidth + 100
        gsap.to(track, {
          x: () => -getScroll(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${getScroll()}`,
            invalidateOnRefresh: true,
          },
        })
      }

      // Testimonial cards stagger
      ScrollTrigger.batch('.testimonial-card', {
        onEnter: (batch) => {
          gsap.from(batch, { y: 40, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out' })
        },
        start: 'top 90%',
      })
    }, root)

    return () => ctx.revert()
  }, [])

  const fallbackTestimonials: Testimonial[] = [
    { id: '1', client_name: 'Thabo M.', content: 'Market Sphere Group helped me find a reliable tutor for my children. Professional and responsive throughout.', service_type: 'Academic Tuition', rating: 5, approved: true },
    { id: '2', client_name: 'Keabetswe R.', content: 'Their real estate consultancy made buying our first home in Gaborone straightforward and stress-free.', service_type: 'Real Estate', rating: 5, approved: true },
  ]

  return (
    <div className="home" ref={rootRef}>
      <SkyBackground />

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="section-label hero__label">Market Sphere Group · Gaborone</span>
            <h1 className="display-xl hero__title">
              <span className="hero__line">Connect with</span>
              <span className="hero__line text-gold text-italic">trusted providers</span>
              <span className="hero__line">across Botswana</span>
            </h1>
            <p className="lead hero__sub">
              A professional marketplace linking customers with verified service providers — from tutoring and real estate to youth empowerment and entrepreneurship.
            </p>
            <div className="hero__actions">
              <Button to="/browse" size="lg">
                Explore Providers <ArrowRight size={16} />
              </Button>
              <Button to="/register?role=provider" variant="secondary" size="lg">
                List Your Business
              </Button>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__visual-ring" />
            <HeroDemo />
          </div>
        </div>
        <div className="hero__scroll-hint">
          <span>Scroll to explore</span>
          <ArrowDown size={16} />
        </div>
      </section>

      <Marquee items={MARQUEE_ITEMS} />

      {/* Vision + Stats */}
      <section className="section section--vision">
        <div className="container">
          <div className="section-header reveal-item">
            <span className="section-label">Our Vision</span>
            <h2 className="display-lg">{COMPANY.mission}</h2>
            <p>{COMPANY.vision}</p>
          </div>
          <div className="stats-row">
            <div className="stat-card bento-card">
              <span className="stat-card__number">8+</span>
              <span className="stat-card__label">Service categories</span>
              <p>From academic tuition to real estate consultancy</p>
            </div>
            <div className="stat-card bento-card">
              <span className="stat-card__number">SADC</span>
              <span className="stat-card__label">Expansion ready</span>
              <p>Built in Botswana, scaling across the region</p>
            </div>
            <div className="stat-card bento-card">
              <span className="stat-card__number">100%</span>
              <span className="stat-card__label">Verified network</span>
              <p>Every provider reviewed by our team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal services — pinned scroll */}
      <section className="services-pin" ref={servicesPinRef}>
        <div className="services-pin__header container">
          <span className="section-label">What We Offer</span>
          <h2 className="display-lg">Services that empower<br /><em className="text-gold">the nation</em></h2>
        </div>
        <div className="services-track-wrap">
          <div className="services-track" ref={servicesTrackRef}>
            {SERVICES.map((service, i) => {
              const Icon = SERVICE_ICONS[service.icon] || Lightbulb
              return (
                <article key={service.title} className="service-panel bento-card">
                  <span className="service-panel__index">0{i + 1}</span>
                  <div className="service-panel__icon"><Icon size={28} /></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <Link to="/services" className="service-panel__link">
                    Learn more <ArrowRight size={14} />
                  </Link>
                </article>
              )
            })}
            <article className="service-panel service-panel--cta bento-card">
              <h3>See all services</h3>
              <p>Explore our full range of professional and socio-economic solutions.</p>
              <Button to="/services" size="lg">View Services</Button>
            </article>
          </div>
        </div>
      </section>

      {/* Providers */}
      <section className="section section--providers">
        <div className="container">
          <div className="section-header section-header--center reveal-item">
            <span className="section-label">Our Network</span>
            <h2>Featured providers</h2>
            <p>Browse verified professionals ready to help you master your field.</p>
          </div>
          {providers.length > 0 ? (
            <div className="providers-grid">
              {providers.map((p, i) => (
                <ProviderCard key={p.id} provider={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="empty-state bento-card reveal-item">
              <p>Provider listings coming soon. Be the first to <Link to="/register?role=provider">join our network</Link>.</p>
            </div>
          )}
          <div className="section-cta">
            <Button to="/browse" size="lg">Browse All Providers</Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section--testimonials">
        <div className="container">
          <div className="section-header reveal-item">
            <span className="section-label">Client Stories</span>
            <h2>Satisfied clients<br /><em className="text-gold">across Botswana</em></h2>
          </div>
          <div className="testimonials-grid">
            {(testimonials.length > 0 ? testimonials : fallbackTestimonials).map((t) => (
              <blockquote key={t.id} className="testimonial-card bento-card">
                <div className="testimonial-card__stars">★★★★★</div>
                <p>"{t.content}"</p>
                <footer>
                  <strong>{t.client_name}</strong>
                  {t.service_type && <span>{t.service_type}</span>}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--cta">
        <div className="container">
          <div className="cta-panel bento-card reveal-item">
            <h2 className="display-lg">Ready to get started?</h2>
            <p>Join MarketSphere — whether you're looking for services or offering them.</p>
            <div className="cta-panel__actions">
              <Button to="/register" size="lg">Create Account</Button>
              <Button to="/contact" variant="secondary" size="lg">Contact Us</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
