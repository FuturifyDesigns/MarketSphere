import { useRef, useEffect, type ReactNode, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onIntroComplete } from '../../lib/intro'
import { onHomeSectionsReady } from '../../lib/homeSectionsReady'
import { flushScrollRefresh } from '../../lib/scrollRefresh'
import { markServicesShowcaseReady } from '../../lib/servicesShowcaseReady'
import { initProvidersReveal } from '../../animations/providersReveal'
import { SERVICES } from '../../lib/constants'
import './ServicesShowcase.css'

gsap.registerPlugin(ScrollTrigger)

const FADE_EASE = 'power2.inOut'
const REVEAL_EASE = 'power2.out'
const CROSSFADE = 0.48

const base = import.meta.env.BASE_URL

function splitTitle(title: string) {
  const words = title.split(' ')
  if (words.length <= 1) return { first: title, second: '' }
  const second = words.pop()!
  return { first: words.join(' '), second }
}

function PosterTilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const tiltRef = useRef<HTMLDivElement>(null)

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 12}deg) scale3d(1.04, 1.04, 1.04)`
  }

  const handleLeave = () => {
    const el = tiltRef.current
    if (el) el.style.transform = 'rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)'
  }

  return (
    <div
      className={`services-showcase__visual-tilt-wrap ${className}`.trim()}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div ref={tiltRef} className="services-showcase__visual-tilt">
        {children}
      </div>
    </div>
  )
}

function setSlideHidden(slide: HTMLElement, isRight: boolean) {
  const mediaX = isRight ? -90 : 90
  const copyX = isRight ? 70 : -70
  const visual = slide.querySelector('.services-showcase__visual')
  const copy = slide.querySelector('.services-showcase__copy')
  const title = slide.querySelector('.services-showcase__title')
  const tagline = slide.querySelector('.services-showcase__tagline')
  const desc = slide.querySelector('.services-showcase__desc')
  const cta = slide.querySelector('.services-showcase__cta')

  if (title) gsap.set(title, { scale: 0.72, opacity: 0, y: 28 })
  if (tagline) gsap.set(tagline, { opacity: 0, y: 18 })
  if (desc) gsap.set(desc, { opacity: 0, y: 22 })
  if (cta) gsap.set(cta, { opacity: 0, y: 12 })
  if (visual) {
    gsap.set(visual, {
      x: mediaX,
      opacity: 1,
      visibility: 'visible',
      scale: 0.96,
    })
  }
  if (copy) gsap.set(copy, { x: copyX, opacity: 0, visibility: 'visible' })
}

export function ServicesShowcase() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let ctx: gsap.Context | undefined
    let providersCleanup: (() => void) | undefined
    let started = false
    let booted = false

    const init = () => {
      if (started) return
      started = true

      SERVICES.forEach((service) => {
        const preload = new Image()
        preload.src = `${base}${service.image}`
      })

      ctx = gsap.context(() => {
        const pin = root.querySelector<HTMLElement>('.services-showcase__pin')
        const intro = root.querySelector<HTMLElement>('.services-showcase__intro')
        const slides = gsap.utils.toArray<HTMLElement>('.services-showcase__slide', root)
        const bgLayers = gsap.utils.toArray<HTMLElement>('.services-showcase__bg-layer', root)
        const dots = gsap.utils.toArray<HTMLElement>('.services-showcase__dot', root)

        const mm = gsap.matchMedia()

        mm.add('(min-width: 901px)', () => {
          if (!pin || !intro || slides.length === 0) return

          gsap.set(slides, { autoAlpha: 0, zIndex: 0, pointerEvents: 'none' })
          gsap.set(bgLayers, { autoAlpha: 0 })
          gsap.set(intro, { autoAlpha: 1, y: 0, zIndex: 3 })
          gsap.set('.services-showcase__intro .section-label', { opacity: 0, y: 16 })
          gsap.set('.services-showcase__mega-word', { opacity: 0, scale: 0.5, y: 60 })
          gsap.set('.services-showcase__intro-tagline', { opacity: 0, y: 36 })
          gsap.set(dots, { scale: 1, opacity: 0 })

          slides.forEach((slide) => {
            setSlideHidden(slide, slide.classList.contains('is-right'))
          })

          const tl = gsap.timeline({ paused: true, defaults: { ease: REVEAL_EASE } })

          tl.fromTo(
            '.services-showcase__intro .section-label',
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.45, ease: REVEAL_EASE },
          )
            .fromTo(
              '.services-showcase__mega-word',
              { scale: 0.5, opacity: 0, y: 60 },
              { scale: 1, opacity: 1, y: 0, duration: 1, ease: REVEAL_EASE },
              '-=0.12',
            )
            .fromTo(
              '.services-showcase__intro-tagline',
              { y: 36, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, ease: REVEAL_EASE },
              '-=0.45',
            )
            .to(
              dots,
              { opacity: 0.35, duration: 0.35, stagger: 0.05, ease: FADE_EASE },
              '-=0.35',
            )
          .to({}, { duration: 0.35 })
          .to(intro, { autoAlpha: 0, y: -36, duration: 0.55, ease: FADE_EASE }, '+=0.15')
          .set(intro, { visibility: 'hidden', pointerEvents: 'none' })

          slides.forEach((slide, i) => {
            const visual = slide.querySelector('.services-showcase__visual')
            const copy = slide.querySelector('.services-showcase__copy')
            const title = slide.querySelector('.services-showcase__title')
            const tagline = slide.querySelector('.services-showcase__tagline')
            const desc = slide.querySelector('.services-showcase__desc')
            const cta = slide.querySelector('.services-showcase__cta')
            const isRight = slide.classList.contains('is-right')
            const mediaX = isRight ? -90 : 90
            const copyX = isRight ? 70 : -70
            const label = `svc-${i}`

            tl.addLabel(label)

            if (i > 0) {
              const prev = slides[i - 1]
              tl.to(bgLayers[i - 1], { autoAlpha: 0, duration: CROSSFADE, ease: FADE_EASE }, label)
              tl.to(prev, { autoAlpha: 0, duration: CROSSFADE, ease: FADE_EASE }, label)
              tl.set(prev, { zIndex: 0, pointerEvents: 'none' }, `${label}+=${CROSSFADE}`)
              if (dots[i - 1]) {
                tl.to(dots[i - 1], { scale: 1, opacity: 0.35, duration: CROSSFADE, ease: FADE_EASE }, label)
              }
            }

            if (bgLayers[i]) {
              tl.to(
                bgLayers[i],
                { autoAlpha: 1, duration: CROSSFADE, ease: FADE_EASE },
                label,
              )
            }

            tl.set(slide, { autoAlpha: 1, zIndex: 2, pointerEvents: 'auto' }, `${label}+=${CROSSFADE * 0.4}`)

            if (dots[i]) {
              tl.to(dots[i], { scale: 1.35, opacity: 1, duration: CROSSFADE, ease: FADE_EASE }, `${label}+=${CROSSFADE * 0.15}`)
            }

            if (title) {
              tl.fromTo(
                title,
                { scale: 0.72, opacity: 0, y: 28, visibility: 'visible' },
                { scale: 1, opacity: 1, y: 0, duration: 0.65, ease: REVEAL_EASE },
                `${label}+=${CROSSFADE * 0.55}`,
              )
            }

            if (tagline) {
              tl.fromTo(
                tagline,
                { opacity: 0, y: 18, visibility: 'visible' },
                { opacity: 1, y: 0, duration: 0.55, ease: REVEAL_EASE },
                `${label}+=${CROSSFADE * 0.72}`,
              )
            }

            if (visual) {
              tl.fromTo(
                visual,
                {
                  x: mediaX,
                  scale: 0.96,
                },
                {
                  x: 0,
                  scale: 1,
                  duration: 0.85,
                  ease: REVEAL_EASE,
                },
                `${label}+=${CROSSFADE * 0.85}`,
              )
            }

            if (copy) {
              tl.fromTo(
                copy,
                { x: copyX, opacity: 0, visibility: 'visible' },
                { x: 0, opacity: 1, duration: 0.8, ease: REVEAL_EASE },
                `${label}+=${CROSSFADE * 0.95}`,
              )
            }

            if (desc) {
              tl.fromTo(
                desc,
                { opacity: 0, y: 22, visibility: 'visible' },
                { opacity: 1, y: 0, duration: 0.6, ease: REVEAL_EASE },
                `${label}+=${CROSSFADE * 1.1}`,
              )
            }

            if (cta) {
              tl.fromTo(
                cta,
                { opacity: 0, y: 12, visibility: 'visible' },
                { opacity: 1, y: 0, duration: 0.5, ease: REVEAL_EASE },
                `${label}+=${CROSSFADE * 1.22}`,
              )
            }

            if (i < slides.length - 1) {
              tl.to({}, { duration: 0.3 })
            }
          })

          ScrollTrigger.create({
            trigger: pin,
            start: 'top top',
            end: () => `+=${tl.duration() * window.innerHeight * 0.42}`,
            pin: true,
            pinSpacing: true,
            scrub: 1.35,
            anticipatePin: 0,
            animation: tl,
            invalidateOnRefresh: true,
            id: 'services-showcase',
            onLeave: (self) => {
              if (self.direction === 1) {
                gsap.set(intro, { visibility: 'hidden', pointerEvents: 'none' })
              }
            },
          })
        })

        mm.add('(max-width: 900px)', () => {
          gsap.utils.toArray<HTMLElement>('.services-showcase__mobile-card', root).forEach((card, i) => {
            gsap.fromTo(
              card,
              { y: 48, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.9,
                ease: REVEAL_EASE,
                scrollTrigger: {
                  trigger: card,
                  start: 'top 88%',
                  once: true,
                },
                delay: i * 0.04,
              },
            )
          })
        })
      }, root)

      flushScrollRefresh()
      markServicesShowcaseReady()

      const providersSection = root.closest('.home')?.querySelector<HTMLElement>('.section--providers')
      if (providersSection) {
        providersCleanup = initProvidersReveal(providersSection)
      }
    }

    const boot = () => {
      if (booted) return
      booted = true
      onHomeSectionsReady(init)
    }

    const removeIntroListener = onIntroComplete(boot)
    const failsafe = window.setTimeout(boot, 4200)

    return () => {
      window.clearTimeout(failsafe)
      removeIntroListener()
      providersCleanup?.()
      ctx?.revert()
    }
  }, [])

  return (
    <section className="services-showcase" ref={rootRef} aria-label="Our services">
      <div className="services-showcase__pin">
        <div className="services-showcase__bg-stack" aria-hidden="true">
          {SERVICES.map((service) => (
            <div key={`bg-${service.title}`} className="services-showcase__bg-layer">
              <img
                src={`${base}${service.image}`}
                alt=""
                className="services-showcase__slide-blur"
                loading="eager"
                decoding="async"
              />
              <div className="services-showcase__slide-scrim" />
            </div>
          ))}
        </div>

        <div className="services-showcase__intro">
          <span className="section-label">What We Offer</span>
          <h2 className="services-showcase__mega">
            <span className="services-showcase__mega-word">Services</span>
          </h2>
          <p className="services-showcase__intro-tagline">
            that empower <em className="text-gold">the nation</em>
          </p>
        </div>

        <div className="services-showcase__stage">
          {SERVICES.map((service, i) => {
            const { first, second } = splitTitle(service.title)
            return (
              <article
                key={service.title}
                className={`services-showcase__slide ${i % 2 === 1 ? 'is-right' : 'is-left'}`}
              >
                <div className="services-showcase__slide-content">
                  <div className="services-showcase__copy">
                    <span className="services-showcase__index">0{i + 1}</span>
                    <p className="services-showcase__tagline">{service.tagline}</p>
                    <h3 className="services-showcase__title">
                      {first && <span>{first}</span>}
                      {second && <span className="text-gold"> {second}</span>}
                    </h3>
                    <p className="services-showcase__desc">{service.description}</p>
                    <Link to="/services" className="services-showcase__cta">
                      Learn more <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="services-showcase__visual">
                    <PosterTilt>
                      <img
                        src={`${base}${service.image}`}
                        alt={service.title}
                        className="services-showcase__visual-poster"
                        loading="eager"
                        decoding="async"
                      />
                    </PosterTilt>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="services-showcase__progress" aria-hidden="true">
          {SERVICES.map((service) => (
            <span key={service.title} className="services-showcase__dot" />
          ))}
        </div>
      </div>

      <div className="services-showcase__mobile">
        <div className="container">
          <div className="section-header">
            <span className="section-label">What We Offer</span>
            <h2 className="display-lg">
              Services that empower<br />
              <em className="text-gold">the nation</em>
            </h2>
          </div>
          {SERVICES.map((service, i) => {
            const { first, second } = splitTitle(service.title)
            return (
              <article key={service.title} className="services-showcase__mobile-card bento-card">
                <div className="services-showcase__slide-backdrop" aria-hidden="true">
                  <img
                    src={`${base}${service.image}`}
                    alt=""
                    className="services-showcase__slide-blur"
                    loading="lazy"
                  />
                  <div className="services-showcase__slide-scrim" />
                </div>
                <div className="services-showcase__mobile-body">
                  <span className="services-showcase__index">0{i + 1}</span>
                  <div className="services-showcase__mobile-visual">
                    <PosterTilt>
                      <img
                        src={`${base}${service.image}`}
                        alt={service.title}
                        className="services-showcase__visual-poster"
                        loading="lazy"
                      />
                    </PosterTilt>
                  </div>
                  <p className="services-showcase__tagline">{service.tagline}</p>
                  <h3 className="services-showcase__title">
                    {first && <span>{first}</span>}
                    {second && <span className="text-gold"> {second}</span>}
                  </h3>
                  <p className="services-showcase__desc">{service.description}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
