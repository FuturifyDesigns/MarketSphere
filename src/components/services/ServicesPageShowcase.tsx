import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SERVICES } from '../../lib/constants'
import { onIntroComplete } from '../../lib/intro'
import { preloadServiceVideos, primeVisibleServiceVideos } from '../../lib/serviceVideoPreload'
import { initServicesPageShowcase } from '../../animations/servicesPageReveal'
import './ServicesPageShowcase.css'

const base = import.meta.env.BASE_URL

function keepVideosPlaying(videos: HTMLVideoElement[]) {
  const playAll = () => {
    videos.forEach((video) => {
      if (video.paused) void video.play().catch(() => {})
    })
  }

  playAll()
  const timer = window.setInterval(playAll, 150)

  videos.forEach((video) => {
    video.addEventListener('canplay', playAll)
    video.addEventListener('canplaythrough', playAll)
  })

  return () => {
    window.clearInterval(timer)
    videos.forEach((video) => {
      video.removeEventListener('canplay', playAll)
      video.removeEventListener('canplaythrough', playAll)
    })
  }
}

export function ServicesPageShowcase() {
  const rootRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    void preloadServiceVideos().then(() => {
      primeVisibleServiceVideos(root)
    })

    const videos = primeVisibleServiceVideos(root)
    return keepVideosPlaying(videos)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let cleanupShowcase: (() => void) | undefined
    let initialized = false

    const init = () => {
      if (initialized) return
      initialized = true
      cleanupShowcase = initServicesPageShowcase(root)
      primeVisibleServiceVideos(root)
    }

    const removeIntroListener = onIntroComplete(init)
    const failsafe = window.setTimeout(init, 4200)

    return () => {
      window.clearTimeout(failsafe)
      removeIntroListener()
      cleanupShowcase?.()
    }
  }, [])

  return (
    <section className="svc-page" ref={rootRef} aria-label="Our services showcase">
      <div className="svc-page__pin">
        <div className="svc-page__progress" aria-hidden="true">
          <div className="svc-page__progress-track" />
          <div className="svc-page__progress-fill" />
        </div>

        <div className="svc-page__dots" aria-hidden="true">
          {SERVICES.map((service) => (
            <span key={service.title} className="svc-page__dot" />
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
          {SERVICES.map((service, i) => {
            const isRight = i % 2 === 1

            return (
              <article
                key={service.title}
                className={`svc-page__slide ${isRight ? 'svc-page__slide--right' : 'svc-page__slide--left'}`}
                style={{ '--svc-accent': service.accent } as CSSProperties}
              >
                <div className="svc-page__slide-inner container">
                  <div className="svc-page__media-wrap">
                    <div className="svc-page__media-glow" aria-hidden="true" />
                    <div className="svc-page__media">
                      <video
                        className="svc-page__video"
                        data-service-index={i}
                        data-service-title={service.title}
                        src={`${base}${service.video}`}
                        loop
                        muted
                        autoPlay
                        playsInline
                        preload="auto"
                        aria-label={`${service.title} showcase video`}
                      />
                    </div>
                  </div>
                  <div className="svc-page__copy">
                    <span className="svc-page__index">0{i + 1}</span>
                    <p className="svc-page__tagline">{service.tagline}</p>
                    <h3 className="svc-page__title">{service.title}</h3>
                    <p className="svc-page__desc">{service.description}</p>
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
