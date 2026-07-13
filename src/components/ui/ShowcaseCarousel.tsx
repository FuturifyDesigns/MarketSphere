import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import './ShowcaseCarousel.css'

interface ShowcaseCarouselProps<T> {
  items: T[]
  renderItem: (item: T) => ReactNode
  getKey: (item: T) => string
  ariaLabel: string
  autoplayMs?: number
  className?: string
}

function useMobileCarouselMotion() {
  const [mobileMotion, setMobileMotion] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const onChange = () => setMobileMotion(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return mobileMotion
}

export function ShowcaseCarousel<T>({
  items,
  renderItem,
  getKey,
  ariaLabel,
  autoplayMs = 5200,
  className = '',
}: ShowcaseCarouselProps<T>) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const mobileMotion = useMobileCarouselMotion()

  useEffect(() => {
    setIndex(0)
  }, [items.length])

  useEffect(() => {
    if (items.length <= 1 || paused) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length)
    }, autoplayMs)
    return () => window.clearInterval(timer)
  }, [items.length, paused, autoplayMs])

  if (items.length === 0) return null

  const goPrev = () => setIndex((current) => (current - 1 + items.length) % items.length)
  const goNext = () => setIndex((current) => (current + 1) % items.length)
  const currentItem = items[index]

  const slideVariants = mobileMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: 36 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -36 },
      }

  return (
    <div
      className={`showcase-carousel ${className}`.trim()}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="showcase-carousel__viewport" aria-roledescription="carousel" aria-label={ariaLabel}>
        <AnimatePresence mode="wait">
          <motion.div
            key={getKey(currentItem)}
            className="showcase-carousel__slide"
            initial={slideVariants.initial}
            animate={slideVariants.animate}
            exit={slideVariants.exit}
            transition={{ duration: mobileMotion ? 0.28 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderItem(currentItem)}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 ? (
        <>
          <button type="button" className="showcase-carousel__nav showcase-carousel__nav--prev" onClick={goPrev} aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className="showcase-carousel__nav showcase-carousel__nav--next" onClick={goNext} aria-label="Next slide">
            <ChevronRight size={20} />
          </button>
          <div className="showcase-carousel__dots" role="tablist" aria-label={`${ariaLabel} slides`}>
            {items.map((item, dotIndex) => (
              <button
                key={getKey(item)}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Go to slide ${dotIndex + 1}`}
                className={dotIndex === index ? 'showcase-carousel__dot showcase-carousel__dot--active' : 'showcase-carousel__dot'}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
