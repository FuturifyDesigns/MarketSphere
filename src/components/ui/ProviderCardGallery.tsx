import { useEffect, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSlideshowAutoplay } from '../../hooks/useSlideshowAutoplay'

type ProviderCardGalleryProps = {
  images: string[]
  autoplayMs?: number
}

function stopLinkNavigation(event: MouseEvent, action: () => void) {
  event.preventDefault()
  event.stopPropagation()
  action()
}

export function ProviderCardGallery({ images, autoplayMs = 2800 }: ProviderCardGalleryProps) {
  const [index, setIndex] = useState(0)
  const imageKey = images.join('|')
  const { rootProps, bump } = useSlideshowAutoplay(images.length, setIndex, {
    intervalMs: autoplayMs,
    resumeAfterMs: 3500,
  })

  useEffect(() => {
    setIndex(0)
  }, [imageKey])

  if (!images.length) return null

  const safeIndex = Math.min(index, images.length - 1)

  const goPrev = () => {
    setIndex((current) => (current - 1 + images.length) % images.length)
    bump()
  }
  const goNext = () => {
    setIndex((current) => (current + 1) % images.length)
    bump()
  }
  const goTo = (dotIndex: number) => {
    setIndex(dotIndex)
    bump()
  }

  return (
    <div className="provider-card__gallery" {...rootProps}>
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={images[safeIndex]}
          src={images[safeIndex]}
          alt=""
          className="provider-card__image provider-card__gallery-image"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
                className={`provider-card__gallery-dot${dotIndex === safeIndex ? ' provider-card__gallery-dot--active' : ''}`}
                onClick={(event) => stopLinkNavigation(event, () => goTo(dotIndex))}
                aria-label={`Show photo ${dotIndex + 1}`}
              />
            ))}
          </div>
          <span className="provider-card__gallery-counter" aria-live="polite">
            {safeIndex + 1}/{images.length}
          </span>
        </>
      ) : null}
    </div>
  )
}
