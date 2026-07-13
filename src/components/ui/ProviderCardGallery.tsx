import { useEffect, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type ProviderCardGalleryProps = {
  images: string[]
  autoplayMs?: number
}

function stopLinkNavigation(event: MouseEvent, action: () => void) {
  event.preventDefault()
  event.stopPropagation()
  action()
}

export function ProviderCardGallery({ images, autoplayMs = 4000 }: ProviderCardGalleryProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setIndex(0)
  }, [images.join('|')])

  useEffect(() => {
    if (images.length <= 1 || paused) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, autoplayMs)
    return () => window.clearInterval(timer)
  }, [images.length, paused, autoplayMs])

  if (!images.length) return null

  const goPrev = () => setIndex((current) => (current - 1 + images.length) % images.length)
  const goNext = () => setIndex((current) => (current + 1) % images.length)

  return (
    <div
      className="provider-card__gallery"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={images[index]}
          src={images[index]}
          alt=""
          className="provider-card__image provider-card__gallery-image"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          decoding="async"
        />
      </AnimatePresence>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="provider-card__gallery-nav provider-card__gallery-nav--prev"
            onClick={(event) => stopLinkNavigation(event, goPrev)}
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="provider-card__gallery-nav provider-card__gallery-nav--next"
            onClick={(event) => stopLinkNavigation(event, goNext)}
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>
          <div className="provider-card__gallery-dots" aria-hidden="true">
            {images.map((url, dotIndex) => (
              <button
                key={url}
                type="button"
                className={`provider-card__gallery-dot${dotIndex === index ? ' provider-card__gallery-dot--active' : ''}`}
                onClick={(event) => stopLinkNavigation(event, () => setIndex(dotIndex))}
                aria-label={`Show photo ${dotIndex + 1}`}
              />
            ))}
          </div>
          <span className="provider-card__gallery-counter" aria-live="polite">
            {index + 1}/{images.length}
          </span>
        </>
      ) : null}
    </div>
  )
}
