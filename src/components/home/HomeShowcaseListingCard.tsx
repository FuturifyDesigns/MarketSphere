import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { SHOWCASE_DEAL_LABELS, showcaseAvailabilityLabel, showcaseIsClosed } from '../../lib/showcase'
import type { ShowcaseListing } from '../../lib/types'
import { ShowcaseOwnerContacts } from '../showcase/ShowcaseOwnerContacts'
import { ShowcaseTextCover } from '../showcase/ShowcaseTextCover'
import './HomeShowcaseListingCard.css'

const PHOTO_DWELL_MS = 2800

type Props = {
  listing: ShowcaseListing
  /** Called after every photo has been shown (or after one dwell if there is only one / none). */
  onPhotosCycleComplete?: () => void
}

export function HomeShowcaseListingCard({ listing, onPhotosCycleComplete }: Props) {
  const column = listing.showcase_columns
  const columnSlug = column?.slug
  const images = listing.image_urls || []
  const detailPath = columnSlug ? `/showcase/${columnSlug}/${listing.id}` : '/showcase'
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const onCompleteRef = useRef(onPhotosCycleComplete)
  const indexRef = useRef(0)
  onCompleteRef.current = onPhotosCycleComplete

  useEffect(() => {
    indexRef.current = 0
    setIndex(0)

    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let cancelled = false
    let timer: number | undefined

    const clear = () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
        timer = undefined
      }
    }

    const finishAndAdvance = () => {
      if (cancelled) return
      onCompleteRef.current?.()
    }

    const dwell = reduceMotion ? 1200 : PHOTO_DWELL_MS

    const scheduleFrom = (photoIndex: number) => {
      clear()
      timer = window.setTimeout(() => {
        if (cancelled) return

        const count = images.length

        // No / single photo: dwell once, then next listing card.
        if (count <= 1) {
          finishAndAdvance()
          return
        }

        // More photos left in this listing.
        if (photoIndex < count - 1) {
          const next = photoIndex + 1
          indexRef.current = next
          setIndex(next)
          scheduleFrom(next)
          return
        }

        // Last photo has been shown for a full dwell — go to next card.
        finishAndAdvance()
      }, dwell)
    }

    scheduleFrom(0)

    return () => {
      cancelled = true
      clear()
    }
  }, [listing.id, images.length])

  const safeIndex = images.length ? Math.min(index, images.length - 1) : 0

  const goPrev = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (images.length <= 1) return
    setIndex((current) => {
      const next = (current - 1 + images.length) % images.length
      indexRef.current = next
      return next
    })
  }

  const goNext = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (images.length <= 1) return
    setIndex((current) => {
      const next = (current + 1) % images.length
      indexRef.current = next
      return next
    })
  }

  const goTo = (event: MouseEvent, next: number) => {
    event.preventDefault()
    event.stopPropagation()
    indexRef.current = next
    setIndex(next)
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
    setIndex((current) => {
      const next =
        delta < 0
          ? (current + 1) % images.length
          : (current - 1 + images.length) % images.length
      indexRef.current = next
      return next
    })
  }

  return (
    <article className="home-showcase-listing-card">
      <div
        className="home-showcase-listing-card__media"
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
                key={`${url}-${i}`}
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
          <Link to={detailPath} className="home-showcase-listing-card__placeholder" aria-hidden="true">
            <ShowcaseTextCover title={listing.title} />
          </Link>
        )}

        <span className="home-showcase-listing-card__deal">{SHOWCASE_DEAL_LABELS[listing.deal_type]}</span>
        <span
          className={`home-showcase-listing-card__availability${showcaseIsClosed(listing) ? ' is-closed' : ''}`}
        >
          {showcaseAvailabilityLabel(listing)}
        </span>
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
                  key={`${url}-dot-${i}`}
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
        <ShowcaseOwnerContacts
          listing={{
            ...listing,
            columnTitle: column?.title,
            columnSlug: column?.slug,
          }}
          compact
        />
        <Link to={detailPath} className="home-showcase-listing-card__more">
          View listing
        </Link>
      </div>
    </article>
  )
}
