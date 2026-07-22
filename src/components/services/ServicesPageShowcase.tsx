import { useEffect, useRef, type CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import { onIntroComplete } from '../../lib/intro'
import { initServicesPageShowcase } from '../../animations/servicesPageReveal'
import { createMarketingService } from '../../lib/cmsTypes'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import type { MarketingService } from '../../lib/siteContentDefaults'
import { EditableText } from '../cms/EditableText'
import { EditableLink } from '../cms/EditableLink'
import { EditableAsset } from '../cms/EditableAsset'
import { Button } from '../ui/Button'
import { ServiceSlideMedia } from './ServiceSlideMedia'
import gsap from 'gsap'
import './ServicesPageShowcase.css'

type ServicesBlock = {
  showcase: {
    eyebrow: string
    title: string
    titleEmphasis: string
    lead: string
    ctaLabel: string
  }
  items: MarketingService[]
}

export function ServicesPageShowcase() {
  const rootRef = useRef<HTMLElement>(null)
  const { getBlock, updateField } = useSiteContent()
  const canEditField = useSectionFieldEdit()
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

  useEffect(() => {
    const root = rootRef.current
    if (!root || !canEditField) return
    gsap.set(root.querySelectorAll('.svc-page__slide, .svc-page__copy, .svc-page__media'), {
      pointerEvents: 'auto',
    })
  }, [canEditField, items.length])

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
          <EditableText contentKey="services" path="showcase.eyebrow" as="span" className="section-label" />
          <h2 className="svc-page__mega">
            <EditableText contentKey="services" path="showcase.title" as="span" />{' '}
            <em className="text-gold">
              <EditableText contentKey="services" path="showcase.titleEmphasis" as="span" />
            </em>
          </h2>
          <EditableText contentKey="services" path="showcase.lead" as="p" className="svc-page__intro-lead" multiline />
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
                      <ServiceSlideMedia
                        video={service.video}
                        image={service.image}
                        title={service.title}
                        index={i}
                      />
                      {canEditField ? (
                        <div className="svc-page__media-tools">
                          <EditableAsset
                            contentKey="services"
                            path={`items.${i}.image`}
                            value={service.image || ''}
                            uploadFolder="services"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            label="Change photo"
                          />
                          <EditableAsset
                            contentKey="services"
                            path={`items.${i}.video`}
                            value={service.video || ''}
                            uploadFolder="services"
                            accept="video/mp4,video/webm"
                            label="Upload video"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="svc-page__copy">
                    <span className="svc-page__index">0{i + 1}</span>
                    <EditableText contentKey="services" path={`items.${i}.tagline`} as="p" className="svc-page__tagline" />
                    <EditableText contentKey="services" path={`items.${i}.title`} as="h3" className="svc-page__title" />
                    <EditableText contentKey="services" path={`items.${i}.description`} as="p" className="svc-page__desc" multiline />
                    <EditableLink
                      contentKey="services"
                      labelPath="showcase.ctaLabel"
                      to="/contact"
                      className="svc-page__cta"
                    >
                      <ArrowRight size={14} />
                    </EditableLink>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {canEditField ? (
        <div className="container cms-list-edit__add">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void updateField('services', 'items', [...items, createMarketingService()])}
          >
            Add service
          </Button>
          {items.length > 1 ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void updateField('services', 'items', items.slice(0, -1))}
            >
              Remove last service
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
