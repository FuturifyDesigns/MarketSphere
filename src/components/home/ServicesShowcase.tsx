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

        gsap.set(slides, { autoAlpha: 0 })
        gsap.set(layers, { autoAlpha: 0 })
        gsap.set(intro, { autoAlpha: 1 })
        gsap.set(dots, { scale: 1, opacity: 0.35 })

        const scrollPerSlide = 1.35
        const scrollTotal = 1.1 + slides.length * scrollPerSlide

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${window.innerHeight * scrollTotal}`,
            pin,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        tl.fromTo(
          '.services-showcase__intro .section-label',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' },
        )
          .fromTo(
            '.services-showcase__mega-word',
            { scale: 0.5, opacity: 0, y: 60 },
            { scale: 1, opacity: 1, y: 0, duration: 0.9, ease: 'power4.out' },
            '-=0.1',
          )
          .fromTo(
            '.services-showcase__intro-tagline',
            { y: 36, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
            '-=0.4',
          )
          .to(intro, { autoAlpha: 0, y: -40, duration: 0.45, ease: 'power2.in' }, '+=0.35')

        slides.forEach((slide, i) => {
          const layer = layers[i]
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
            tl.to(layers[i - 1], { autoAlpha: 0, duration: 0.35, ease: 'power2.inOut' }, label)
            tl.to(slides[i - 1], { autoAlpha: 0, duration: 0.2 }, label)
            if (dots[i - 1]) tl.to(dots[i - 1], { scale: 1, opacity: 0.35, duration: 0.15 }, label)
          }

          tl.to(layer, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, label)
          tl.fromTo(
            layer?.querySelector('.services-showcase__scenery-img'),
            { scale: 1.15 },
            { scale: 1, duration: scrollPerSlide, ease: 'none' },
            label,
          )
          tl.set(slide, { autoAlpha: 1 }, label)

          if (dots[i]) {
            tl.to(dots[i], { scale: 1.35, opacity: 1, duration: 0.2, ease: 'power2.out' }, `${label}+=0.05`)
          }

          tl.fromTo(
            title,
            { scale: 0.72, opacity: 0, y: 28 },
            { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'power4.out' },
            `${label}+=0.12`,
          )
          tl.fromTo(
            tagline,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
            `${label}+=0.28`,
          )
          tl.fromTo(
            visual,
            {
              x: mediaX,
              opacity: 0,
              scale: 0.94,
              clipPath: isRight ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
            },
            {
              x: 0,
              opacity: 1,
              scale: 1,
              clipPath: 'inset(0 0% 0 0%)',
              duration: 0.75,
              ease: 'power3.out',
            },
            `${label}+=0.38`,
          )
          tl.fromTo(
            copy,
            { x: copyX, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
            `${label}+=0.48`,
          )
          tl.fromTo(
            desc,
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
            `${label}+=0.58`,
          )
          tl.fromTo(
            cta,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
            `${label}+=0.68`,
          )

          tl.to({}, { duration: 0.25 })
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
              duration: 0.85,
              ease: 'power3.out',
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

      {/* Mobile stacked layout */}
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
                <img src={`${base}${service.image}`} alt={service.title} loading="lazy" />
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
