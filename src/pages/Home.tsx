import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowDown, BadgeCheck, ShieldCheck, Users } from 'lucide-react'
import { SkyBackground } from '../components/home/SkyBackground'
import { Marquee } from '../components/home/Marquee'
import { ServicesShowcase } from '../components/home/ServicesShowcase'
import { HeroVideo } from '../components/hero/HeroVideo'
import { ProviderCard } from '../components/ui/ProviderCard'
import { ShowcaseCarousel } from '../components/ui/ShowcaseCarousel'
import { Button } from '../components/ui/Button'
import { WelcomeModal } from '../components/onboarding/WelcomeModal'
import { COMPANY } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { onIntroComplete, isIntroComplete } from '../lib/intro'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'
import { isMobileViewport } from '../lib/nativeScroll'
import { markHomeSectionsReady } from '../lib/homeSectionsReady'
import { isServicesShowcaseReady, onServicesShowcaseReady } from '../lib/servicesShowcaseReady'
import { initHomeSectionReveals } from '../animations/homeSectionReveal'
import { initBelowFoldSections } from '../animations/belowFoldReveal'
import type { Provider, Testimonial } from '../lib/types'
import { ensureProviderCategoryIfNeeded } from '../lib/providerCategory'
import './Home.css'
import '../components/ui/ShowcaseCarousel.css'

gsap.registerPlugin(ScrollTrigger)

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
  const [providers, setProviders] = useState<Provider[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadFeaturedProviders() {
      const [{ data: providerRows }, { data: categoryRows }] = await Promise.all([
        supabase
          .from('providers')
          .select('*, provider_services(*, categories(*))')
          .eq('status', 'approved')
          .limit(8),
        supabase.from('categories').select('*').order('sort_order'),
      ])

      if (cancelled) return

      const categories = categoryRows || []
      const providers = providerRows || []
      const categorized = categories.length
        ? await Promise.all(
            providers.map((provider) => ensureProviderCategoryIfNeeded(provider, categories)),
          )
        : providers

      if (!cancelled) setProviders(categorized)
    }

    void loadFeaturedProviders()

    supabase.from('testimonials').select('*').eq('approved', true).limit(4)
      .then(({ data }) => setTestimonials(data || []))

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let cleanup: (() => void) | undefined

    const refresh = () => {
      cleanup?.()
      cleanup = initBelowFoldSections(root)
    }

    if (isServicesShowcaseReady()) {
      refresh()
    }

    const removeListener = onServicesShowcaseReady(refresh)

    return () => {
      removeListener()
      cleanup?.()
    }
  }, [providers.length, testimonials.length])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let ctx: gsap.Context | undefined
    let started = false

    const initAnimations = () => {
      if (started) return
      started = true

      ctx = gsap.context(() => {
        const isDesktop = !isMobileViewport()

        if (isDesktop) {
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
        }

        const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } })
        heroTl
          .fromTo('.hero__line', { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, clearProps: 'transform,opacity' })
          .fromTo('.hero__sub', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, clearProps: 'transform,opacity' }, '-=0.5')
          .fromTo('.hero__actions', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, clearProps: 'transform,opacity' }, '-=0.4')
          .fromTo('.hero__visual', { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, clearProps: 'transform,opacity' }, '-=0.8')
          .fromTo('.hero__scroll-hint', { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'opacity' }, '-=0.3')

        if (isDesktop && heroRef.current) {
          gsap.to('.hero__content', {
            y: -60,
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

        gsap.utils.toArray<HTMLElement>('.reveal-item').forEach((el) => {
          if (el.closest('[data-home-section]')) return
          gsap.fromTo(
            el,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                once: true,
              },
            },
          )
        })

        const cleanupHomeSections = initHomeSectionReveals(root)
        markHomeSectionsReady()

        scheduleScrollRefresh()

        return () => {
          cleanupHomeSections?.()
        }
      }, root)
    }

    const removeIntroListener = onIntroComplete(initAnimations)
    const failsafe = isIntroComplete() ? undefined : window.setTimeout(initAnimations, 4200)

    return () => {
      if (failsafe !== undefined) window.clearTimeout(failsafe)
      removeIntroListener()
      ctx?.revert()
      document.documentElement.style.setProperty('--sky-progress', '0')
      document.documentElement.setAttribute('data-theme', 'day')
    }
  }, [])

  const fallbackTestimonials: Testimonial[] = [
    { id: '1', client_name: 'Thabo M.', content: 'Market Sphere Group helped me find a reliable tutor for my children. Professional and responsive throughout.', service_type: 'Academic Tuition', rating: 5, approved: true },
    { id: '2', client_name: 'Keabetswe R.', content: 'Their real estate consultancy made buying our first home in Gaborone straightforward and stress-free.', service_type: 'Real Estate', rating: 5, approved: true },
  ]

  return (
    <div className="home" ref={rootRef}>
      <WelcomeModal />
      <SkyBackground />

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="container hero__inner">
          <div className="hero__content">
            <div className="hero__welcome" aria-label={`Welcome to ${COMPANY.shortName}`}>
              <span className="hero__welcome-eyebrow">Welcome to</span>
              <span className="hero__welcome-brand">{COMPANY.shortName}</span>
            </div>
            <h1 className="display-xl hero__title">
              <span className="hero__line">Connect with</span>
              <span className="hero__line text-gold text-italic">trusted providers</span>
              <span className="hero__line">across Botswana</span>
            </h1>
            <p className="lead hero__sub">
              A professional marketplace linking customers with verified service providers — from tutoring and real estate to youth empowerment and entrepreneurship.
            </p>
            <div className="hero__actions">
              <span className="hero__action-target" data-onboarding="hero-browse">
                <Button to="/browse" size="lg">
                  Explore Providers <ArrowRight size={16} />
                </Button>
              </span>
              <span className="hero__action-target" data-onboarding="hero-provider">
                <Button to="/register?role=provider" variant="secondary" size="lg">
                  List Your Business
                </Button>
              </span>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__visual-ring" />
            <HeroVideo />
          </div>
        </div>
        <div className="hero__scroll-hint">
          <span>Scroll to explore</span>
          <ArrowDown size={16} />
        </div>
      </section>

      <div className="home-marquee">
        <Marquee items={MARQUEE_ITEMS} />
      </div>

      {/* Vision + Stats */}
      <section className="section section--vision home-showcase" data-home-section="showcase">
        <div className="home-showcase__pin">
          <div className="home-showcase__intro">
            <span className="section-label home-section__label">Our Vision</span>
            <h2 className="home-showcase__mega home-showcase__mega--vision">
              <span className="home-section__title-word">{COMPANY.mission}</span>
            </h2>
            <p className="home-section__lead">{COMPANY.vision}</p>
          </div>
          <div className="home-showcase__stage">
            <div className="container">
              <div className="stats-row">
                <div className="stat-card home-section__item">
                  <span className="stat-card__number">8+</span>
                  <span className="stat-card__label">Service categories</span>
                  <p>From academic tuition to real estate consultancy</p>
                </div>
                <div className="stat-card home-section__item">
                  <span className="stat-card__number">SADC</span>
                  <span className="stat-card__label">Expansion ready</span>
                  <p>Built in Botswana, scaling across the region</p>
                </div>
                <div className="stat-card home-section__item">
                  <span className="stat-card__number">100%</span>
                  <span className="stat-card__label">Verified network</span>
                  <p>Every provider reviewed by our team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ServicesShowcase />

      {/* Providers */}
      <section className="section section--providers home-section">
        <div className="container">
          <header className="home-section__header section-header section-header--center">
            <span className="section-label home-section__label">Our Network</span>
            <h2 className="display-lg home-section__title">
              <span className="home-section__title-word">
                Featured <em className="text-gold">providers</em>
              </span>
            </h2>
            <p className="home-section__lead">
              Browse verified professionals ready to help you master your field.
            </p>
            <div className="home-providers-trust" aria-label="Provider network highlights">
              <span className="home-providers-trust__item">
                <BadgeCheck size={15} aria-hidden="true" />
                Verified listings
              </span>
              <span className="home-providers-trust__item">
                <ShieldCheck size={15} aria-hidden="true" />
                Trusted across Botswana
              </span>
              <span className="home-providers-trust__item">
                <Users size={15} aria-hidden="true" />
                Growing provider network
              </span>
            </div>
          </header>

          <div className="home-providers-stage">
            <div className="home-providers-stage__glow" aria-hidden="true" />
            {providers.length > 0 ? (
              providers.length <= 3 ? (
                <div className={`home-providers-grid home-providers-grid--count-${providers.length}`}>
                  {providers.map((provider, index) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      index={index}
                      disableAnimation
                      variant="showcase"
                    />
                  ))}
                </div>
              ) : (
                <ShowcaseCarousel
                  className="home-providers-carousel showcase-carousel--wide"
                  items={providers}
                  getKey={(provider) => provider.id}
                  ariaLabel="Featured providers"
                  renderItem={(provider) => (
                    <ProviderCard provider={provider} disableAnimation variant="showcase" />
                  )}
                />
              )
            ) : (
              <div className="empty-state bento-card home-section__item home-providers-empty">
                <p>Provider listings coming soon. Be the first to <Link to="/register?role=provider">join our network</Link>.</p>
              </div>
            )}
          </div>

          <div className="section-cta home-section__footer home-providers-footer">
            <p className="home-providers-footer__text">
              Discover more categories, locations, and specialists on the full marketplace.
            </p>
            <Button to="/browse" size="lg">
              Browse all providers
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section--testimonials home-section">
        <div className="container">
          <header className="home-section__header section-header section-header--center">
            <span className="section-label home-section__label">Client Stories</span>
            <h2 className="display-lg home-section__title">
              <span className="home-section__title-word">
                Satisfied clients <em className="text-gold">across Botswana</em>
              </span>
            </h2>
          </header>
          <ShowcaseCarousel
            className="home-testimonials-carousel"
            items={testimonials.length > 0 ? testimonials : fallbackTestimonials}
            getKey={(testimonial) => testimonial.id}
            ariaLabel="Client testimonials"
            renderItem={(testimonial) => (
              <blockquote className="testimonial-card bento-card home-section__item">
                <div className="testimonial-card__stars">★★★★★</div>
                <p>"{testimonial.content}"</p>
                <footer>
                  <strong>{testimonial.client_name}</strong>
                  {testimonial.service_type ? <span>{testimonial.service_type}</span> : null}
                </footer>
              </blockquote>
            )}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="section section--cta home-section" data-home-section="stack">
        <div className="container">
          <div className="cta-panel bento-card">
            <header className="home-section__header home-section__header--inline">
              <h2 className="display-lg home-section__title">
                <span className="home-section__title-word">Ready to get started?</span>
              </h2>
              <p className="home-section__lead">Join {COMPANY.shortName} — whether you're looking for services or offering them.</p>
            </header>
            <div className="cta-panel__actions home-section__footer">
              <Button to="/register" size="lg">Create Account</Button>
              <Button to="/contact" variant="secondary" size="lg">Contact Us</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
