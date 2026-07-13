import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { onIntroComplete } from '../../lib/intro'
import { initServicesPageShowcase } from '../../animations/servicesPageReveal'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSiteEdit } from '../../context/SiteEditContext'
import type { MarketingService } from '../../lib/siteContentDefaults'
import { EditableText } from '../cms/EditableText'
import { EditableImage } from '../cms/EditableImage'
import { ServiceSlideMedia } from './ServiceSlideMedia'
import './ServicesPageShowcase.css'

type ServicesBlock = {
  items: MarketingService[]
}

export function ServicesPageShowcase() {
  const rootRef = useRef<HTMLElement>(null)
  const { getBlock } = useSiteContent()
  const { editMode } = useSiteEdit()
  const services = getBlock<ServicesBlock>('services')
  const items = services.items || []

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let cleanupShowcase: (() => void) | undefined
    let initialized = false

    const init = () => {
      if (initialized) return
      initialized = true
      cleanupShowcase = initServicesPageShowcase(root)
    }

    const removeIntroListener = onIntroComplete(init)
    const failsafe = window.setTimeout(init, 4200)

    return () => {
      window.clearTimeout(failsafe)
      removeIntroListener()
      cleanupShowcase?.()
    }
  }, [items.length])

  return (
    <section className="svc-page" ref={rootRef} aria-label="Our services showcase">
      <div className="svc-page__pin">
        <div className="svc-page__progress" aria-hidden="true">
          <div className="svc-page__progress-track" />
          <div className="svc-page__progress-fill" />
        </div>

        <div className="svc-page__dots" aria-hidden="true">
          {items.map((service) => (
            <span key={service.id} className="svc-page__dot" />
          ))}
        </div>

        <div className="svc-page__intro">
          <span className="section-label">What We Offer</span>
          <h2 className="svc-page__mega">
            Services built for <em className="text-gold">impact</em>
          </h2>
          <p className="svc-page__intro-lead">
            Scroll to explore how Market Sphere Group empowers communities across Botswana.
          </p>
        </div>

        <div className="svc-page__stage">
          {items.map((service, i) => {
            const isRight = i % 2 === 1

            return (
              <article
                key={service.id}
                className={`svc-page__slide ${isRight ? 'svc-page__slide--right' : 'svc-page__slide--left'}`}
                style={
                  {
                    '--svc-accent': service.accent,
                    '--svc-gradient': service.gradient,
                  } as CSSProperties
                }
              >
                <div className="svc-page__slide-bg" aria-hidden="true" />
                <div className="svc-page__slide-inner container">
                  <div className="svc-page__media-wrap">
                    <div className="svc-page__media-glow" aria-hidden="true" />
                    <div className="svc-page__media">
                      {editMode ? (
                        <EditableImage
                          contentKey="services"
                          path={`items.${i}.image`}
                          src={service.image}
                          alt={service.title}
                          uploadFolder="services"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ServiceSlideMedia
                          video={service.video}
                          image={service.image}
                          title={service.title}
                          index={i}
                        />
                      )}
                    </div>
                  </div>
                  <div className="svc-page__copy">
                    <span className="svc-page__index">0{i + 1}</span>
                    <EditableText contentKey="services" path={`items.${i}.tagline`} as="p" className="svc-page__tagline" />
                    <EditableText contentKey="services" path={`items.${i}.title`} as="h3" className="svc-page__title" />
                    <EditableText contentKey="services" path={`items.${i}.description`} as="p" className="svc-page__desc" multiline />
                    <Link to="/contact" className="svc-page__cta">
                      Enquire now <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
