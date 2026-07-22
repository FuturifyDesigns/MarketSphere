import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSlideshowAutoplay } from '../../hooks/useSlideshowAutoplay'
import './GallerySlideshow.css'

interface GallerySlideshowProps {
  images: string[]
  onImageClick?: (index: number) => void
  autoplayMs?: number
}

export function GallerySlideshow({ images, onImageClick, autoplayMs = 3000 }: GallerySlideshowProps) {
  const [index, setIndex] = useState(0)
  const { rootProps, bump } = useSlideshowAutoplay(images.length, setIndex, {
    intervalMs: autoplayMs,
    resumeAfterMs: 3500,
  })

  useEffect(() => {
    setIndex(0)
  }, [images.length])

  if (images.length === 0) return null

  const safeIndex = Math.min(index, images.length - 1)

  const goPrev = () => {
    setIndex((current) => (current - 1 + images.length) % images.length)
    bump()
  }
  const goNext = () => {
    setIndex((current) => (current + 1) % images.length)
    bump()
  }
  const goTo = (thumbIndex: number) => {
    setIndex(thumbIndex)
    bump()
  }

  return (
    <div className="gallery-slideshow" {...rootProps}>
      <div className="gallery-slideshow__stage">
        <AnimatePresence mode="sync" initial={false}>
          <motion.button
            key={images[safeIndex]}
            type="button"
            className="gallery-slideshow__image-btn"
            onClick={() => onImageClick?.(safeIndex)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`View gallery photo ${safeIndex + 1}`}
          >
            <img
              src={images[safeIndex]}
              alt=""
              decoding="async"
              fetchPriority={safeIndex === 0 ? 'high' : 'auto'}
            />
          </motion.button>
        </AnimatePresence>

        {images.length > 1 ? (
          <>
            <button type="button" className="gallery-slideshow__nav gallery-slideshow__nav--prev" onClick={goPrev} aria-label="Previous photo">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="gallery-slideshow__nav gallery-slideshow__nav--next" onClick={goNext} aria-label="Next photo">
              <ChevronRight size={20} />
            </button>
            <p className="gallery-slideshow__counter">
              {safeIndex + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="gallery-slideshow__meta">
          <p className="gallery-slideshow__meta-label">Gallery slideshow</p>
          <p className="gallery-slideshow__meta-count" aria-live="polite">
            Photo {safeIndex + 1} of {images.length}
          </p>
        </div>
      ) : null}

      {images.length > 1 ? (
        <div className="gallery-slideshow__thumbs">
          {images.map((url, thumbIndex) => (
            <button
              key={url}
              type="button"
              className={
                thumbIndex === safeIndex
                  ? 'gallery-slideshow__thumb gallery-slideshow__thumb--active'
                  : 'gallery-slideshow__thumb'
              }
              onClick={() => goTo(thumbIndex)}
              aria-label={`Show photo ${thumbIndex + 1}`}
            >
              <img src={url} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
