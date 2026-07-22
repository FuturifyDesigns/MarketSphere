import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'
import type { Testimonial } from '../../lib/types'
import { displayName, initialLetter } from '../../lib/safe'
import { useSlideshowAutoplay } from '../../hooks/useSlideshowAutoplay'
import './TestimonialsShowcase.css'

type TestimonialsShowcaseProps = {
  items: Testimonial[]
  autoplayMs?: number
}

function Stars({ rating }: { rating: number }) {
  const count = Math.min(5, Math.max(1, Math.round(rating || 5)))
  return (
    <div className="testimonials-showcase__stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={16}
          className={i < count ? 'testimonials-showcase__star testimonials-showcase__star--on' : 'testimonials-showcase__star'}
          fill={i < count ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function TestimonialsShowcase({ items, autoplayMs = 3500 }: TestimonialsShowcaseProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [stageHeight, setStageHeight] = useState<number | undefined>()
  const maxHeightRef = useRef(0)
  const panelRef = useRef<HTMLElement>(null)
  const touchStartX = useRef<number | null>(null)

  const setIndexFromAutoplay = useCallback((updater: (current: number) => number) => {
    setDirection(1)
    setIndex(updater)
  }, [])

  const { rootProps, bump } = useSlideshowAutoplay(items.length, setIndexFromAutoplay, {
    intervalMs: autoplayMs,
    resumeAfterMs: 2200,
    pauseOnHover: false,
  })

  useEffect(() => {
    setIndex(0)
    maxHeightRef.current = 0
    setStageHeight(undefined)
  }, [items.length])

  useEffect(() => {
    if (index >= items.length && items.length > 0) {
      setIndex(items.length - 1)
    }
  }, [index, items.length])

  const safeIndex = items.length ? Math.min(index, items.length - 1) : 0
  const current = items[safeIndex]

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const measure = () => {
      const h = Math.ceil(panel.getBoundingClientRect().height)
      if (h <= 0) return
      if (h > maxHeightRef.current) {
        maxHeightRef.current = h
        setStageHeight(h)
      }
    }

    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(panel)
    return () => ro?.disconnect()
  }, [safeIndex, current])

  if (!items.length || !current) return null

  const goTo = (next: number, dir: number) => {
    setDirection(dir)
    setIndex(((next % items.length) + items.length) % items.length)
    bump()
  }

  const goPrev = () => goTo(safeIndex - 1, -1)
  const goNext = () => goTo(safeIndex + 1, 1)

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const end = event.changedTouches[0]?.clientX ?? start
    const delta = end - start
    if (Math.abs(delta) < 48) return
    if (delta < 0) goNext()
    else goPrev()
  }

  const name = displayName(current.client_name, 'Client')
  const initial = initialLetter(current.client_name)

  return (
    <div className="testimonials-showcase" {...rootProps}>
      <div className="testimonials-showcase__glow" aria-hidden="true" />

      <div className="testimonials-showcase__frame">
        {items.length > 1 ? (
          <button
            type="button"
            className="testimonials-showcase__nav testimonials-showcase__nav--prev testimonials-showcase__nav--overlay"
            onClick={goPrev}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </button>
        ) : null}

        <div
          className="testimonials-showcase__stage"
          style={stageHeight ? { minHeight: stageHeight } : undefined}
          aria-roledescription="carousel"
          aria-label="Client testimonials"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="sync" custom={direction} initial={false}>
            <motion.article
              key={current.id}
              ref={panelRef}
              className="testimonials-showcase__panel"
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              variants={{
                enter: (dir: number) => ({
                  opacity: 0,
                  x: dir > 0 ? 40 : -40,
                }),
                center: {
                  opacity: 1,
                  x: 0,
                },
                exit: (dir: number) => ({
                  opacity: 0,
                  x: dir > 0 ? -28 : 28,
                }),
              }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="testimonials-showcase__quote-mark" aria-hidden="true">
                <Quote size={48} strokeWidth={1.25} />
              </div>

              <Stars rating={current.rating ?? 5} />

              <blockquote className="testimonials-showcase__quote">
                <p>“{current.content}”</p>
              </blockquote>

              <footer className="testimonials-showcase__author">
                <span className="testimonials-showcase__avatar" aria-hidden="true">
                  {initial}
                </span>
                <div className="testimonials-showcase__author-text">
                  <strong>{name}</strong>
                  {current.service_type ? (
                    <span className="testimonials-showcase__service">{current.service_type}</span>
                  ) : null}
                </div>
              </footer>

              {items.length > 1 ? (
                <div
                  key={`progress-${current.id}-${safeIndex}`}
                  className="testimonials-showcase__progress"
                  style={{ animationDuration: `${autoplayMs}ms` }}
                  aria-hidden="true"
                />
              ) : null}
            </motion.article>
          </AnimatePresence>
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            className="testimonials-showcase__nav testimonials-showcase__nav--next testimonials-showcase__nav--overlay"
            onClick={goNext}
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </button>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="testimonials-showcase__controls">
          <button
            type="button"
            className="testimonials-showcase__nav testimonials-showcase__nav--prev testimonials-showcase__nav--inline"
            onClick={goPrev}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="testimonials-showcase__dots" role="tablist" aria-label="Testimonial slides">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Go to story ${i + 1}`}
                className={
                  i === safeIndex
                    ? 'testimonials-showcase__dot testimonials-showcase__dot--active'
                    : 'testimonials-showcase__dot'
                }
                onClick={() => goTo(i, i > safeIndex ? 1 : -1)}
              />
            ))}
          </div>
          <button
            type="button"
            className="testimonials-showcase__nav testimonials-showcase__nav--next testimonials-showcase__nav--inline"
            onClick={goNext}
            aria-label="Next testimonial"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
