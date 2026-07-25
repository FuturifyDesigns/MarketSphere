import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  Mail,
  MapPin,
  Megaphone,
  Music2,
  Phone,
  Sprout,
  Users,
  Briefcase,
  Monitor,
  X,
  ZoomIn,
  type LucideIcon,
} from 'lucide-react'
import { COMPANY } from '../lib/constants'
import { SHOWCASE_DEAL_LABELS, showcaseContactMailto, showcaseWhatsAppLink } from '../lib/showcase'
import { supabase } from '../lib/supabase'
import type { ShowcaseColumn, ShowcaseListing } from '../lib/types'
import { Button } from '../components/ui/Button'
import './Showcase.css'

const COLUMN_ICONS: Record<string, LucideIcon> = {
  building: Building2,
  users: Users,
  sprout: Sprout,
  lightbulb: Lightbulb,
  'graduation-cap': GraduationCap,
  megaphone: Megaphone,
  music: Music2,
  briefcase: Briefcase,
  monitor: Monitor,
}

function ColumnIcon({ name }: { name: string | null }) {
  const Icon = (name && COLUMN_ICONS[name]) || Building2
  return <Icon size={22} aria-hidden />
}

/** Reveals an element with a fade/slide once it scrolls into view. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, shown }
}

const AUTOPLAY_MS = 4000

/** Auto-advancing image slideshow with arrows, dots, swipe, and lightbox trigger. */
function ShowcaseGallery({
  images,
  title,
  onZoom,
}: {
  images: string[]
  title: string
  onZoom: (index: number) => void
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)
  const count = images.length

  const goTo = useCallback(
    (next: number) => {
      setIndex((current) => {
        if (count === 0) return current
        return (next + count) % count
      })
    },
    [count],
  )

  useEffect(() => {
    if (count <= 1 || paused) return
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [count, paused])

  if (count === 0) {
    return (
      <div className="showcase-card__media-empty" aria-hidden>
        <Building2 size={28} />
      </div>
    )
  }

  return (
    <div
      className="showcase-gallery"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null
        setPaused(true)
      }}
      onTouchEnd={(e) => {
        const start = touchX.current
        touchX.current = null
        if (start === null) return
        const delta = (e.changedTouches[0]?.clientX ?? start) - start
        if (Math.abs(delta) > 40) goTo(index + (delta < 0 ? 1 : -1))
      }}
    >
      <div
        className="showcase-gallery__track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            className="showcase-gallery__slide"
            onClick={() => onZoom(i)}
            aria-label={`View photo ${i + 1} of ${count} for ${title}`}
            tabIndex={i === index ? 0 : -1}
          >
            <img src={url} alt="" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            <span className="showcase-gallery__zoom" aria-hidden>
              <ZoomIn size={16} />
            </span>
          </button>
        ))}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="showcase-gallery__nav showcase-gallery__nav--prev"
            onClick={() => goTo(index - 1)}
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="showcase-gallery__nav showcase-gallery__nav--next"
            onClick={() => goTo(index + 1)}
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>
          <div className="showcase-gallery__dots" role="tablist" aria-label="Photos">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                className={`showcase-gallery__dot${i === index ? ' is-active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-selected={i === index}
                role="tab"
              />
            ))}
          </div>
          <span className="showcase-gallery__count">
            {index + 1}/{count}
          </span>
        </>
      ) : null}
    </div>
  )
}

/** Full-screen lightbox with keyboard + arrow navigation. */
function ShowcaseLightbox({
  images,
  startIndex,
  title,
  onClose,
}: {
  images: string[]
  startIndex: number
  title: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const count = images.length

  const go = useCallback(
    (next: number) => setIndex((current) => (count === 0 ? current : (next + count) % count)),
    [count],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(index + 1)
      if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, go, onClose])

  return (
    <div className="showcase-lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="showcase-lightbox__close" onClick={onClose} aria-label="Close">
        <X size={22} />
      </button>
      <div className="showcase-lightbox__stage" onClick={(e) => e.stopPropagation()}>
        <img key={images[index]} src={images[index]} alt="" className="showcase-lightbox__img" />
        {count > 1 ? (
          <>
            <button
              type="button"
              className="showcase-lightbox__nav showcase-lightbox__nav--prev"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              className="showcase-lightbox__nav showcase-lightbox__nav--next"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
            >
              <ChevronRight size={26} />
            </button>
            <span className="showcase-lightbox__count">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}

function ListingCard({
  listing,
  columnTitle,
  order = 0,
}: {
  listing: ShowcaseListing
  columnTitle?: string
  order?: number
}) {
  const { ref, shown } = useReveal<HTMLElement>()
  const [lightbox, setLightbox] = useState<number | null>(null)
  const mailto = showcaseContactMailto(listing.title, columnTitle)
  const whatsapp = showcaseWhatsAppLink(COMPANY.phones[0], listing.title)

  return (
    <article
      ref={ref}
      className={[
        'showcase-card',
        listing.featured ? 'showcase-card--featured' : '',
        'showcase-reveal',
        shown ? 'is-visible' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ transitionDelay: `${Math.min(order, 6) * 60}ms` }}
    >
      <div className="showcase-card__media">
        <ShowcaseGallery
          images={listing.image_urls}
          title={listing.title}
          onZoom={(i) => setLightbox(i)}
        />
        <span className="showcase-card__deal">{SHOWCASE_DEAL_LABELS[listing.deal_type]}</span>
      </div>
      <div className="showcase-card__body">
        <h3>{listing.title}</h3>
        {listing.location ? (
          <p className="showcase-card__location">
            <MapPin size={14} aria-hidden /> {listing.location}
          </p>
        ) : null}
        {listing.price_label ? <p className="showcase-card__price">{listing.price_label}</p> : null}
        {listing.summary ? <p className="showcase-card__summary">{listing.summary}</p> : null}
        {listing.description ? <p className="showcase-card__description">{listing.description}</p> : null}
        <div className="showcase-card__actions">
          <a className="btn btn--primary btn--sm" href={mailto}>
            <Mail size={14} /> Contact Market Sphere
          </a>
          <a className="btn btn--secondary btn--sm" href={whatsapp} target="_blank" rel="noreferrer">
            <Phone size={14} /> WhatsApp
          </a>
        </div>
      </div>

      {lightbox !== null && listing.image_urls.length > 0 ? (
        <ShowcaseLightbox
          images={listing.image_urls}
          startIndex={lightbox}
          title={listing.title}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </article>
  )
}

export function Showcase() {
  const [columns, setColumns] = useState<ShowcaseColumn[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [colsRes, listingsRes] = await Promise.all([
        supabase
          .from('showcase_columns')
          .select('*')
          .eq('active', true)
          .order('sort_order'),
        supabase
          .from('showcase_listings')
          .select('column_id')
          .eq('status', 'published'),
      ])

      if (cancelled) return

      if (colsRes.error) {
        console.error('[showcase] columns', colsRes.error)
        setError('Could not load showcase columns. Please try again.')
        setLoading(false)
        return
      }

      const nextCounts: Record<string, number> = {}
      for (const row of listingsRes.data || []) {
        nextCounts[row.column_id] = (nextCounts[row.column_id] || 0) + 1
      }

      setColumns(colsRes.data || [])
      setCounts(nextCounts)
      setLoading(false)
      setError('')
    }

    void load()

    const channel = supabase
      .channel(`showcase-hub-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_columns' }, () => {
        void load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_listings' }, () => {
        void load()
      })
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="page showcase-page">
      <section className="showcase-hero">
        <div className="container showcase-hero__inner page-enter-hero">
          <span className="section-label">Market Sphere Showcase</span>
          <h1 className="display-xl">
            Opportunities across
            <br />
            <em className="text-gold">every field we serve</em>
          </h1>
          <p className="lead showcase-hero__lead">
            Browse live listings from Market Sphere Group — properties, projects, training, and
            opportunities across Botswana. Contact us directly on any listing that interests you.
          </p>
        </div>
      </section>

      <section className="section showcase-columns-section">
        <div className="container">
          {loading ? (
            <p className="showcase-status">Loading showcase…</p>
          ) : error ? (
            <p className="showcase-status showcase-status--error" role="alert">
              {error}
            </p>
          ) : (
            <div className="showcase-columns">
              {columns.map((column, i) => (
                <Link
                  key={column.id}
                  to={`/showcase/${column.slug}`}
                  className="showcase-column-tile showcase-reveal is-visible"
                  style={{ transitionDelay: `${Math.min(i, 8) * 55}ms` }}
                >
                  <span className="showcase-column-tile__icon">
                    <ColumnIcon name={column.icon} />
                  </span>
                  <div className="showcase-column-tile__copy">
                    <h2>{column.title}</h2>
                    {column.tagline ? <p>{column.tagline}</p> : null}
                    <span className="showcase-column-tile__meta">
                      {counts[column.id] || 0} live listing{(counts[column.id] || 0) === 1 ? '' : 's'}
                      <ArrowRight size={14} aria-hidden className="showcase-column-tile__arrow" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export function ShowcaseColumnPage() {
  const { slug = '' } = useParams()
  const [column, setColumn] = useState<ShowcaseColumn | null>(null)
  const [listings, setListings] = useState<ShowcaseListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!slug) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const { data: col, error: colError } = await supabase
        .from('showcase_columns')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle()

      if (cancelled) return

      if (colError) {
        console.error('[showcase] column', colError)
        setError('Could not load this column.')
        setLoading(false)
        return
      }

      if (!col) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const { data: rows, error: listError } = await supabase
        .from('showcase_listings')
        .select('*')
        .eq('column_id', col.id)
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('sort_order')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (listError) {
        console.error('[showcase] listings', listError)
        setError('Could not load listings.')
        setColumn(col)
        setLoading(false)
        return
      }

      setColumn(col)
      setListings(rows || [])
      setNotFound(false)
      setError('')
      setLoading(false)
    }

    void load()

    const channel = supabase
      .channel(`showcase-column-${slug}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_columns' }, () => {
        void load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_listings' }, () => {
        void load()
      })
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [slug])

  const featured = useMemo(() => listings.filter((l) => l.featured), [listings])
  const rest = useMemo(() => listings.filter((l) => !l.featured), [listings])

  if (loading) {
    return (
      <div className="page showcase-page">
        <div className="container showcase-status">Loading listings…</div>
      </div>
    )
  }

  if (notFound || !column) {
    return (
      <div className="page showcase-page">
        <div className="container showcase-empty">
          <h1>Column not found</h1>
          <p>This showcase section is unavailable.</p>
          <Button to="/showcase">Back to Showcase</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page showcase-page">
      <section className="showcase-column-hero">
        <div className="container showcase-column-hero__inner page-enter-hero">
          <Link to="/showcase" className="showcase-back">
            <ArrowLeft size={16} /> All columns
          </Link>
          <div className="showcase-column-hero__title-row">
            <span className="showcase-column-hero__icon">
              <ColumnIcon name={column.icon} />
            </span>
            <div>
              <span className="section-label">Showcase</span>
              <h1 className="display-xl">{column.title}</h1>
            </div>
          </div>
          {column.tagline ? <p className="lead">{column.tagline}</p> : null}
          {column.description ? <p className="showcase-column-hero__desc">{column.description}</p> : null}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {error ? (
            <p className="showcase-status showcase-status--error" role="alert">
              {error}
            </p>
          ) : listings.length === 0 ? (
            <div className="showcase-empty">
              <h2>No live listings yet</h2>
              <p>
                Market Sphere Group will publish opportunities here soon. Meanwhile, reach us at{' '}
                <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
              </p>
              <div className="showcase-empty__actions">
                <Button to="/contact">Contact us</Button>
                <Button to="/showcase" variant="secondary">
                  Browse other columns
                </Button>
              </div>
            </div>
          ) : (
            <>
              {featured.length > 0 ? (
                <div className="showcase-listings-block">
                  <h2 className="showcase-listings-heading">Featured</h2>
                  <div className="showcase-listings">
                    {featured.map((listing, i) => (
                      <ListingCard key={listing.id} listing={listing} columnTitle={column.title} order={i} />
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="showcase-listings-block">
                {featured.length > 0 ? <h2 className="showcase-listings-heading">All listings</h2> : null}
                <div className="showcase-listings">
                  {(featured.length > 0 ? rest : listings).map((listing, i) => (
                    <ListingCard key={listing.id} listing={listing} columnTitle={column.title} order={i} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
