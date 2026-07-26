import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { useSlideshowAutoplay } from '../../hooks/useSlideshowAutoplay'
import { SHOWCASE_DEAL_LABELS } from '../../lib/showcase'
import type { ShowcaseListing } from '../../lib/types'
import './HomeShowcaseListingCard.css'

type Props = {
  listing: ShowcaseListing
}

export function HomeShowcaseListingCard({ listing }: Props) {
  const column = listing.showcase_columns
  const columnSlug = column?.slug
  const images = listing.image_urls || []
  const detailPath = columnSlug ? `/showcase/${columnSlug}/${listing.id}` : '/showcase'
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const { rootProps, bump } = useSlideshowAutoplay(images.length, setIndex, {
    intervalMs: 2800,
    resumeAfterMs: 3500,
  })

  useEffect(() => {
    setIndex(0)
  }, [listing.id, images.length])

  const safeIndex = images.length ? Math.min(index, images.length - 1) : 0

  const goPrev = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIndex((current) => (current - 1 + images.length) % images.length)
    bump()
  }

  const goNext = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIndex((current) => (current + 1) % images.length)
    bump()
  }

  const goTo = (event: MouseEvent, next: number) => {
    event.preventDefault()
    event.stopPropagation()
    setIndex(next)
    bump()
  }

  const onTouchStart = (event: TouchEvent) => {
    event.stopPropagation()
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: TouchEvent) => {
    event.stopPropagation()
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null || images.length <= 1) return
    const end = event.changedTouches[0]?.clientX ?? start
    const delta = end - start
    if (Math.abs(delta) < 40) return
    if (delta < 0) setIndex((current) => (current + 1) % images.length)
    else setIndex((current) => (current - 1 + images.length) % images.length)
    bump()
  }

  return (
    <article className="home-showcase-listing-card">
      <div
        className="home-showcase-listing-card__media"
        {...rootProps}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 0 ? (
          <div
            className="home-showcase-listing-card__track"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {images.map((url, i) => (
              <Link
                key={url}
                to={detailPath}
                className="home-showcase-listing-card__slide"
                tabIndex={i === safeIndex ? 0 : -1}
                aria-label={`View ${listing.title}, photo ${i + 1} of ${images.length}`}
              >
                <img
                  src={url}
                  alt=""
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </Link>
            ))}
          </div>
        ) : (
          <Link to={detailPath} className="home-showcase-listing-card__placeholder" aria-hidden="true" />
        )}

        <span className="home-showcase-listing-card__deal">{SHOWCASE_DEAL_LABELS[listing.deal_type]}</span>
        {column?.title ? (
          <span className="home-showcase-listing-card__column">{column.title}</span>
        ) : null}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="home-showcase-listing-card__nav home-showcase-listing-card__nav--prev"
              onClick={goPrev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="home-showcase-listing-card__nav home-showcase-listing-card__nav--next"
              onClick={goNext}
              aria-label="Next photo"
            >
              <ChevronRight size={18} />
            </button>
            <div className="home-showcase-listing-card__dots" role="tablist" aria-label="Listing photos">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  role="tab"
                  className={`home-showcase-listing-card__dot${i === safeIndex ? ' is-active' : ''}`}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-selected={i === safeIndex}
                  onClick={(event) => goTo(event, i)}
                />
              ))}
            </div>
            <span className="home-showcase-listing-card__count">
              {safeIndex + 1}/{images.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="home-showcase-listing-card__body">
        <h3>
          <Link to={detailPath}>{listing.title}</Link>
        </h3>
        {listing.location ? (
          <p className="home-showcase-listing-card__location">
            <MapPin size={14} aria-hidden /> {listing.location}
          </p>
        ) : null}
        {listing.price_label ? (
          <p className="home-showcase-listing-card__price">{listing.price_label}</p>
        ) : null}
        {listing.summary ? <p className="home-showcase-listing-card__summary">{listing.summary}</p> : null}
        <Link to={detailPath} className="home-showcase-listing-card__more">
          View listing
        </Link>
      </div>
    </article>
  )
}
