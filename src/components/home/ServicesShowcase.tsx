import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onIntroComplete } from '../../lib/intro'
import { SERVICES } from '../../lib/constants'
import './ServicesShowcase.css'

gsap.registerPlugin(ScrollTrigger)

const base = import.meta.env.BASE_URL

function splitTitle(title: string) {
  const words = title.split(' ')
  if (words.length <= 1) return { first: title, second: '' }
  const second = words.pop()!
  return { first: words.join(' '), second }
}

export function ServicesShowcase() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let ctx: gsap.Context | undefined
    let started = false

    const init = () => {
      if (started) return
      started = true

      ctx = gsap.context(() => {
        const pin = root.querySelector('.services-showcase__pin')
        const intro = root.querySelector('.services-showcase__intro')
        const slides = gsap.utils.toArray<HTMLElement>('.services-showcase__slide', root)
        const layers = gsap.utils.toArray<HTMLElement>('.services-showcase__scenery-layer', root)
        const dots = gsap.utils.toArray<HTMLElement>('.services-showcase__dot', root)

        const mm = gsap.matchMedia()

        mm.add('(min-width: 901px)', () => {
          if (!pin || slides.length === 0) return

          const resetSlide = (slide: HTMLElement) => {
            const copyKids = slide.querySelectorAll('.services-showcase__copy > *')
            const visual = slide.querySelector('.services-showcase__visual')
            gsap.set(slide, { autoAlpha: 0 })
            gsap.set(copyKids, { opacity: 0, y: 28 })
            gsap.set(visual, { opacity: 0, y: 32 })
          }

          slides.forEach(resetSlide)
          gsap.set(layers, { autoAlpha: 0 })
          gsap.set(intro, { autoAlpha: 1, y: 0 })
          gsap.set('.services-showcase__mega-word', { opacity: 0, y: 40 })
          gsap.set('.services-showcase__intro-tagline', { opacity: 0, y: 24 })
          gsap.set('.services-showcase__intro .section-label', { opacity: 0, y: 12 })
          gsap.set(dots, { scale: 1, opacity: 0.35 })

          const scrollPerSlide = 1.65
          const scrollTotal = 1.2 + slides.length * scrollPerSlide

          const tl = gsap.timeline({
            defaults: { ease: 'power2.out', immediateRender: false },
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: () => `+=${window.innerHeight * scrollTotal}`,
              pin,
              scrub: 1.15,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })

          // Intro
          tl.to('.services-showcase__intro .section-label', { opacity: 1, y: 0, duration: 0.4 }, 0)
            .to('.services-showcase__mega-word', { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, 0.08)
            .to('.services-showcase__intro-tagline', { opacity: 1, y: 0, duration: 0.55 }, 0.35)
            .to(intro, { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power2.inOut' }, 0.95)

          const introEnd = 1.5

          slides.forEach((slide, i) => {
            const layer = layers[i]
            const copyKids = slide.querySelectorAll('.services-showcase__copy > *')
            const visual = slide.querySelector('.services-showcase__visual')
            const label = `svc-${i}`
            const segment = scrollPerSlide
            const start = i === 0 ? introEnd : undefined

            tl.addLabel(label, start)

            if (i > 0) {
              const prev = slides[i - 1]
              const prevKids = prev.querySelectorAll('.services-showcase__copy > *')
              const prevVisual = prev.querySelector('.services-showcase__visual')

              tl.to(layers[i - 1], { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' }, label)
              tl.to(prevKids, { opacity: 0, y: -16, duration: 0.3, stagger: 0.03, ease: 'power2.in' }, label)
              tl.to(prevVisual, { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in' }, label)
              tl.set(prev, { autoAlpha: 0 }, `${label}+=0.35`)
              if (dots[i - 1]) tl.to(dots[i - 1], { scale: 1, opacity: 0.35, duration: 0.2 }, label)
            }

            tl.to(layer, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, label)
            tl.fromTo(
              layer?.querySelector('.services-showcase__scenery-img'),
              { scale: 1.08 },
              { scale: 1, duration: segment, ease: 'none' },
              label,
            )
            tl.set(slide, { autoAlpha: 1 }, label)

            if (dots[i]) {
              tl.to(dots[i], { scale: 1.25, opacity: 1, duration: 0.25 }, `${label}+=0.05`)
            }

            tl.to(copyKids, {
              opacity: 1,
              y: 0,
              duration: 0.55,
              stagger: 0.07,
              ease: 'power3.out',
            }, `${label}+=0.12`)

            tl.to(visual, {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: 'power3.out',
            }, `${label}+=0.22`)

            tl.to({}, { duration: segment * 0.45 })
          })
        })

        mm.add('(max-width: 900px)', () => {
          gsap.utils.toArray<HTMLElement>('.services-showcase__mobile-card', root).forEach((card) => {
            gsap.fromTo(
              card,
              { y: 36, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.75,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 90%',
                  once: true,
                },
              },
            )
          })
        })
      }, root)

      ScrollTrigger.refresh()
    }

    const removeIntroListener = onIntroComplete(init)
    const failsafe = window.setTimeout(init, 4200)

    return () => {
      window.clearTimeout(failsafe)
      removeIntroListener()
      ctx?.revert()
    }
  }, [])

  return (
    <section className="services-showcase" ref={rootRef} aria-label="Our services">
      <div className="services-showcase__pin">
        <div className="services-showcase__scenery" aria-hidden="true">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="services-showcase__scenery-layer"
              style={{ '--scene-accent': service.accent } as React.CSSProperties}
            >
              <img
                src={`${base}${service.image}`}
                alt=""
                className="services-showcase__scenery-img"
              />
              <div className="services-showcase__scenery-overlay" />
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
                  <img src={`${base}${service.image}`} alt={service.title} loading="lazy" />
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
                <span className="services-showcase__index">0{i + 1}</span>
                <div className="services-showcase__mobile-visual">
                  <img src={`${base}${service.image}`} alt={service.title} loading="lazy" />
                </div>
                <p className="services-showcase__tagline">{service.tagline}</p>
                <h3 className="services-showcase__title">
                  {first && <span>{first}</span>}
                  {second && <span className="text-gold"> {second}</span>}
                </h3>
                <p className="services-showcase__desc">{service.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
