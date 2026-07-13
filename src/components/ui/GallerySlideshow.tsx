import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import './GallerySlideshow.css'

interface GallerySlideshowProps {
  images: string[]
  onImageClick?: (index: number) => void
  autoplayMs?: number
}

export function GallerySlideshow({ images, onImageClick, autoplayMs = 4500 }: GallerySlideshowProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setIndex(0)
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1 || paused) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, autoplayMs)
    return () => window.clearInterval(timer)
  }, [images.length, paused, autoplayMs])

  if (images.length === 0) return null

  const goPrev = () => setIndex((current) => (current - 1 + images.length) % images.length)
  const goNext = () => setIndex((current) => (current + 1) % images.length)

  return (
    <div
      className="gallery-slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="gallery-slideshow__stage">
        <AnimatePresence mode="wait">
          <motion.button
            key={images[index]}
            type="button"
            className="gallery-slideshow__image-btn"
            onClick={() => onImageClick?.(index)}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`View gallery photo ${index + 1}`}
          >
            <img src={images[index]} alt="" decoding="async" fetchPriority={index === 0 ? 'high' : 'auto'} />
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
            <p className="gallery-slideshow__counter">{index + 1} / {images.length}</p>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="gallery-slideshow__meta">
          <p className="gallery-slideshow__meta-label">Gallery slideshow</p>
          <p className="gallery-slideshow__meta-count" aria-live="polite">
            Photo {index + 1} of {images.length}
          </p>
        </div>
      ) : null}

      {images.length > 1 ? (
        <div className="gallery-slideshow__thumbs">
          {images.map((url, thumbIndex) => (
            <button
              key={url}
              type="button"
              className={thumbIndex === index ? 'gallery-slideshow__thumb gallery-slideshow__thumb--active' : 'gallery-slideshow__thumb'}
              onClick={() => setIndex(thumbIndex)}
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
