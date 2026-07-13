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
import { EditableText } from '../components/cms/EditableText'
import { useSiteContent } from '../context/SiteContentContext'
import { useSiteEdit } from '../context/SiteEditContext'
import type { HomeStat } from '../lib/siteContentDefaults'
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

const MARQUEE_ITEMS_FALLBACK = [
  'Youth Empowerment',
  'Real Estate',
  'Academic Tuition',
  'Entrepreneurship',
  'Platform Marketing',
  'Botswana',
  'SADC',
  'Master Your Field',
]

type HomeBlock = {
  hero: {
    welcomeEyebrow: string
    titleLine1: string
    titleLine2: string
    titleLine3: string
    subcopy: string
    ctaBrowse: string
    ctaProvider: string
  }
  stats: HomeStat[]
  marquee: string[]
  providersSection: {
    eyebrow: string
    title: string
    titleEmphasis: string
    lead: string
    cta: string
    footer: string
  }
  vision: {
    eyebrow: string
    title: string
    lead: string
  }
}

export function Home() {
  const { getBlock } = useSiteContent()
  const { editMode } = useSiteEdit()
  const home = getBlock<HomeBlock>('home')
  const company = getBlock<{ shortName: string }>('company')
  const marqueeItems = home.marquee?.length ? home.marquee : MARQUEE_ITEMS_FALLBACK
  const stats = home.stats?.length ? home.stats : []
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
            <div className="hero__welcome" aria-label={`Welcome to ${company.shortName}`}>
              <EditableText contentKey="home" path="hero.welcomeEyebrow" as="span" className="hero__welcome-eyebrow" />
              <span className="hero__welcome-brand">{company.shortName}</span>
            </div>
            <h1 className="display-xl hero__title">
              <span className="hero__line">
                <EditableText contentKey="home" path="hero.titleLine1" as="span" />
              </span>
              <span className="hero__line text-gold text-italic">
                <EditableText contentKey="home" path="hero.titleLine2" as="span" />
              </span>
              <span className="hero__line">
                <EditableText contentKey="home" path="hero.titleLine3" as="span" />
              </span>
            </h1>
            <EditableText contentKey="home" path="hero.subcopy" as="p" className="lead hero__sub" multiline />
            <div className="hero__actions">
              <span className="hero__action-target" data-onboarding="hero-browse">
                <Button to="/browse" size="lg">
                  <EditableText contentKey="home" path="hero.ctaBrowse" as="span" /> <ArrowRight size={16} />
                </Button>
              </span>
              <span className="hero__action-target" data-onboarding="hero-provider">
                <Button to="/register?role=provider" variant="secondary" size="lg">
                  <EditableText contentKey="home" path="hero.ctaProvider" as="span" />
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
        <Marquee items={marqueeItems} />
      </div>

      {/* Vision + Stats */}
      <section className="section section--vision home-showcase" data-home-section="showcase">
        <div className="home-showcase__pin">
          <div className="home-showcase__intro">
            <EditableText contentKey="home" path="vision.eyebrow" as="span" className="section-label home-section__label" />
            <h2 className="home-showcase__mega home-showcase__mega--vision">
              <span className="home-section__title-word">
                <EditableText contentKey="home" path="vision.title" as="span" />
              </span>
            </h2>
            <EditableText contentKey="home" path="vision.lead" as="p" className="home-section__lead" multiline />
          </div>
          <div className="home-showcase__stage">
            <div className="container">
              <div className="stats-row">
                {stats.map((stat, index) => (
                  <div key={stat.id} className="stat-card home-section__item">
                    {editMode ? (
                      <>
                        <EditableText contentKey="home" path={`stats.${index}.number`} as="span" className="stat-card__number" />
                        <EditableText contentKey="home" path={`stats.${index}.label`} as="span" className="stat-card__label" />
                        <EditableText contentKey="home" path={`stats.${index}.description`} as="p" multiline />
                      </>
                    ) : (
                      <>
                        <span className="stat-card__number">{stat.number}</span>
                        <span className="stat-card__label">{stat.label}</span>
                        <p>{stat.description}</p>
                      </>
                    )}
                  </div>
                ))}
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
            <EditableText contentKey="home" path="providersSection.eyebrow" as="span" className="section-label home-section__label" />
            <h2 className="display-lg home-section__title">
              <span className="home-section__title-word">
                Featured <em className="text-gold">
                  <EditableText contentKey="home" path="providersSection.titleEmphasis" as="span" />
                </em>
              </span>
            </h2>
            <EditableText contentKey="home" path="providersSection.lead" as="p" className="home-section__lead" multiline />
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
              <EditableText contentKey="home" path="providersSection.footer" as="span" multiline />
            </p>
            <Button to="/browse" size="lg">
              <EditableText contentKey="home" path="providersSection.cta" as="span" />
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
              <p className="home-section__lead">Join {company.shortName} — whether you're looking for services or offering them.</p>
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
