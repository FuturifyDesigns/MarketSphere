import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSlideshowAutoplay } from '../../hooks/useSlideshowAutoplay'
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
  autoplayMs = 3200,
  className = '',
}: ShowcaseCarouselProps<T>) {
  const [index, setIndex] = useState(0)
  const [viewportHeight, setViewportHeight] = useState<number | undefined>()
  const maxHeightRef = useRef(0)
  const slideRef = useRef<HTMLDivElement>(null)
  const mobileMotion = useMobileCarouselMotion()
  const { rootProps, bump } = useSlideshowAutoplay(items.length, setIndex, {
    intervalMs: autoplayMs,
    resumeAfterMs: 4000,
  })

  useEffect(() => {
    setIndex(0)
    maxHeightRef.current = 0
    setViewportHeight(undefined)
  }, [items.length])

  const safeIndex = items.length ? Math.min(index, items.length - 1) : 0
  const currentItem = items[safeIndex]

  useLayoutEffect(() => {
    const slide = slideRef.current
    if (!slide) return

    const measure = () => {
      const h = Math.ceil(slide.getBoundingClientRect().height)
      if (h <= 0) return
      if (h > maxHeightRef.current) {
        maxHeightRef.current = h
        setViewportHeight(h)
      }
    }

    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(slide)
    return () => ro?.disconnect()
  }, [safeIndex, currentItem, items.length])

  if (items.length === 0) return null

  const goPrev = () => {
    setIndex((current) => (current - 1 + items.length) % items.length)
    bump()
  }
  const goNext = () => {
    setIndex((current) => (current + 1) % items.length)
    bump()
  }
  const goTo = (dotIndex: number) => {
    setIndex(dotIndex)
    bump()
  }

  const slideVariants = mobileMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -28 },
      }

  return (
    <div className={`showcase-carousel ${className}`.trim()} {...rootProps}>
      <div
        className="showcase-carousel__viewport"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        style={viewportHeight ? { height: viewportHeight } : undefined}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            ref={slideRef}
            key={getKey(currentItem)}
            className="showcase-carousel__slide"
            initial={slideVariants.initial}
            animate={slideVariants.animate}
            exit={slideVariants.exit}
            transition={{ duration: mobileMotion ? 0.22 : 0.32, ease: [0.22, 1, 0.36, 1] }}
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
                aria-selected={dotIndex === safeIndex}
                aria-label={`Go to slide ${dotIndex + 1}`}
                className={dotIndex === safeIndex ? 'showcase-carousel__dot showcase-carousel__dot--active' : 'showcase-carousel__dot'}
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
