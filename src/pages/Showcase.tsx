import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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
import { flushScrollRefresh } from '../lib/scrollRefresh'
import { supabase } from '../lib/supabase'
import type { ShowcaseColumn, ShowcaseListing } from '../lib/types'
import { EditableSection } from '../components/cms/EditableSection'
import { EditableText } from '../components/cms/EditableText'
import { CmsExtraSections } from '../components/cms/CmsExtraSections'
import { Button } from '../components/ui/Button'
import './Showcase.css'

gsap.registerPlugin(ScrollTrigger)

const SHOWCASE_ASSET_BASE = `${import.meta.env.BASE_URL}showcase/`
const COLUMN_COVERS: Record<string, string> = {
  'real-estate': `${SHOWCASE_ASSET_BASE}real-estate.webp`,
  'youth-empowerment': `${SHOWCASE_ASSET_BASE}youth-empowerment.webp`,
  farming: `${SHOWCASE_ASSET_BASE}farming.webp`,
  entrepreneurship: `${SHOWCASE_ASSET_BASE}entrepreneurship.webp`,
  'academic-tuition': `${SHOWCASE_ASSET_BASE}academic-tuition.webp`,
  'platform-marketing': `${SHOWCASE_ASSET_BASE}platform-marketing.webp`,
  'music-education': `${SHOWCASE_ASSET_BASE}music-education.webp`,
  'career-development': `${SHOWCASE_ASSET_BASE}career-development.webp`,
  'it-services': `${SHOWCASE_ASSET_BASE}it-services.webp`,
}

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
  columnSlug,
  order = 0,
}: {
  listing: ShowcaseListing
  columnTitle?: string
  columnSlug: string
  order?: number
}) {
  const { ref, shown } = useReveal<HTMLElement>()
  const [lightbox, setLightbox] = useState<number | null>(null)
  const detailPath = `/showcase/${columnSlug}/${listing.id}`
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
        {listing.featured ? <span className="showcase-card__featured-badge">Featured</span> : null}
      </div>
      <Link to={detailPath} className="showcase-card__body showcase-card__body-link">
        <h3>{listing.title}</h3>
        {listing.location ? (
          <p className="showcase-card__location">
            <MapPin size={14} aria-hidden /> {listing.location}
          </p>
        ) : null}
        {listing.price_label ? <p className="showcase-card__price">{listing.price_label}</p> : null}
        {listing.summary ? <p className="showcase-card__summary">{listing.summary}</p> : null}
        <span className="showcase-card__more">View full details</span>
      </Link>
      <div className="showcase-card__actions">
        <a className="btn btn--primary btn--sm" href={mailto}>
          <Mail size={14} /> Contact Market Sphere
        </a>
        <a className="btn btn--secondary btn--sm" href={whatsapp} target="_blank" rel="noreferrer">
          <Phone size={14} /> WhatsApp
        </a>
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
  const navigate = useNavigate()
  const pageRef = useRef<HTMLDivElement | null>(null)
  const curtainRef = useRef<HTMLDivElement | null>(null)
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const [columns, setColumns] = useState<ShowcaseColumn[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openingSlug, setOpeningSlug] = useState<string | null>(null)

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

  useEffect(() => {
    if (loading || error || columns.length === 0 || !pageRef.current) return

    const root = pageRef.current
    const mm = gsap.matchMedia()

    mm.add(
      {
        isMotionOk: '(prefers-reduced-motion: no-preference)',
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isMotionOk, reduceMotion } = context.conditions!

        if (reduceMotion) {
          gsap.set(
            '[data-showcase-hero-copy], [data-showcase-mosaic-card], [data-showcase-heading], [data-showcase-frame], [data-showcase-stage-heading]',
            { autoAlpha: 1, clearProps: 'transform' },
          )
          return
        }

        if (!isMotionOk) return

        const heroCopy = root.querySelectorAll<HTMLElement>('[data-showcase-hero-copy] > *')
        const mosaic = root.querySelectorAll<HTMLElement>('[data-showcase-mosaic-card]')
        const heading = root.querySelectorAll<HTMLElement>('[data-showcase-heading] > *')

        gsap.set(heroCopy, { autoAlpha: 0, y: 28 })
        gsap.set(mosaic, { autoAlpha: 0, y: 36 })
        gsap.set(heading, { autoAlpha: 0, y: 24 })

        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .to(heroCopy, { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.1 })
          .to(mosaic, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, '-=0.5')

        gsap.to(heading, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '[data-showcase-heading]',
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        })

        const stages = gsap.utils.toArray<HTMLElement>('[data-showcase-stage]', root)

        stages.forEach((stage) => {
          const frame = stage.querySelector<HTMLElement>('[data-showcase-frame]')
          const footer = stage.querySelector<HTMLElement>('.showcase-column-tile__footer')
          const stageHeading = stage.querySelector<HTMLElement>('[data-showcase-stage-heading]')
          if (!frame) return

          gsap.set(frame, { transformOrigin: '50% 50%', autoAlpha: 0, y: 46 })
          if (footer) gsap.set(footer, { autoAlpha: 0, y: 14 })
          if (stageHeading) gsap.set(stageHeading, { autoAlpha: 0, y: 20 })

          const fadeIn = gsap.timeline({
            defaults: { ease: 'power2.out' },
            scrollTrigger: {
              trigger: stage,
              start: 'top 72%',
              toggleActions: 'play none none reverse',
            },
          })

          if (stageHeading) fadeIn.to(stageHeading, { autoAlpha: 1, y: 0, duration: 0.6 }, 0)
          fadeIn.to(frame, { autoAlpha: 1, y: 0, duration: 0.85 }, 0.06)
          if (footer) fadeIn.to(footer, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.22)
        })

        const images = root.querySelectorAll<HTMLImageElement>('[data-showcase-cover]')
        const onImageReady = () => flushScrollRefresh()
        images.forEach((img) => {
          if (img.complete) return
          img.addEventListener('load', onImageReady, { once: true })
        })

        flushScrollRefresh()

        return () => {
          images.forEach((img) => img.removeEventListener('load', onImageReady))
        }
      },
      root,
    )

    return () => {
      transitionTimelineRef.current?.kill()
      mm.revert()
    }
  }, [columns, error, loading])

  const handlePointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    event.currentTarget.style.setProperty('--pointer-x', `${x}%`)
    event.currentTarget.style.setProperty('--pointer-y', `${y}%`)
  }

  const handlePointerLeave = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.setProperty('--pointer-x', '50%')
    event.currentTarget.style.setProperty('--pointer-y', '50%')
  }

  const openColumn = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    event.preventDefault()
    if (openingSlug) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !curtainRef.current) {
      navigate(`/showcase/${slug}`)
      return
    }

    setOpeningSlug(slug)
    const card = event.currentTarget
    const frame = card.closest<HTMLElement>('[data-showcase-frame]') ?? card
    const cover = card.querySelector('[data-showcase-cover]')
    const curtain = curtainRef.current
    const timeline = gsap.timeline({
      onComplete: () => navigate(`/showcase/${slug}`),
    })
    transitionTimelineRef.current = timeline

    timeline
      .set(curtain, { display: 'grid', yPercent: 100 })
      .to(
        frame,
        {
          keyframes: {
            x: [0, -12, 10, -7, 5, -2, 0],
            rotation: [0, -0.7, 0.6, -0.4, 0.28, -0.1, 0],
            scale: [1, 1.008, 1.014, 1.018, 1.02, 1.02, 1.02],
            easeEach: 'sine.inOut',
          },
          duration: 0.5,
        },
        0,
      )
      .to(cover, { autoAlpha: 0.92, duration: 0.4, ease: 'power2.inOut' }, 0.1)
      .to(curtain, { yPercent: 0, duration: 0.52, ease: 'power4.inOut' }, 0.34)
  }

  return (
    <div ref={pageRef} className="page showcase-page showcase-hub">
      <EditableSection id="showcase-hero" label="Showcase hero" className="showcase-hero">
        <div className="container showcase-hero__layout">
          <div className="showcase-hero__inner" data-showcase-hero-copy>
            <span className="showcase-hero__eyebrow">
              <span className="showcase-hero__eyebrow-dot" />
              <EditableText contentKey="showcase" path="hero.eyebrow" as="span" />
            </span>
            <h1 className="display-xl">
              <EditableText contentKey="showcase" path="hero.titleLine1" as="span" />
              <br />
              <em className="text-gold">
                <EditableText contentKey="showcase" path="hero.titleEmphasis" as="span" />
              </em>
            </h1>
            <EditableText
              contentKey="showcase"
              path="hero.lead"
              as="p"
              className="lead showcase-hero__lead"
              multiline
            />
          </div>

          <div className="showcase-hero__mosaic">
            {[
              { cover: COLUMN_COVERS['real-estate'], label: 'Real Estate' },
              { cover: COLUMN_COVERS['youth-empowerment'], label: 'Youth Empowerment' },
              { cover: COLUMN_COVERS.farming, label: 'Farming' },
            ].map((item, index) => (
              <button
                key={item.cover}
                type="button"
                className={`showcase-hero__mosaic-card showcase-hero__mosaic-card--${index + 1}`}
                data-showcase-mosaic-card
                aria-label={`${item.label} preview`}
              >
                <img src={item.cover} alt="" />
              </button>
            ))}
            <span className="showcase-hero__orbit" aria-hidden="true" />
            <EditableText
              contentKey="showcase"
              path="hero.mosaicLabel"
              as="span"
              className="showcase-hero__mosaic-label"
            />
          </div>
        </div>
      </EditableSection>

      <section id="showcase-columns" className="section showcase-columns-section">
        <div className="container">
          <EditableSection
            id="showcase-fields-heading"
            label="Fields heading"
            as="div"
            className="showcase-section-heading"
            data-showcase-heading=""
          >
            <div>
              <EditableText
                contentKey="showcase"
                path="fields.eyebrow"
                as="span"
                className="section-label"
              />
              <EditableText contentKey="showcase" path="fields.title" as="h2" />
            </div>
            <EditableText contentKey="showcase" path="fields.lead" as="p" multiline />
          </EditableSection>
        </div>
        {loading ? (
          <div className="container">
            <p className="showcase-status">Loading showcase…</p>
          </div>
        ) : error ? (
          <div className="container">
            <p className="showcase-status showcase-status--error" role="alert">
              {error}
            </p>
          </div>
        ) : (
          <div className="showcase-columns">
            {columns.map((column, i) => (
              <article
                key={column.id}
                className={`showcase-column-stage${i === columns.length - 1 ? ' showcase-column-stage--last' : ''}`}
                data-showcase-stage
                data-field={column.slug}
                style={{ zIndex: i + 1 }}
              >
                <div className="showcase-column-stage__atmosphere" aria-hidden="true" />
                <div className="showcase-column-stage__sticky">
                  <div className="showcase-column-stage__heading" data-showcase-stage-heading>
                    <span className="showcase-column-stage__index">
                      Field {String(i + 1).padStart(2, '0')} of {String(columns.length).padStart(2, '0')}
                    </span>
                    <h3 className="showcase-column-stage__title">{column.title}</h3>
                  </div>
                  <div className="showcase-column-stage__frame" data-showcase-frame>
                    <Link
                      to={`/showcase/${column.slug}`}
                      className={`showcase-column-tile${openingSlug === column.slug ? ' is-opening' : ''}`}
                      data-showcase-column
                      onPointerMove={handlePointerMove}
                      onPointerLeave={handlePointerLeave}
                      onClick={(event) => openColumn(event, column.slug)}
                    >
                      <div className="showcase-column-tile__media">
                        <img
                          src={COLUMN_COVERS[column.slug]}
                          alt={`${column.title} showcase`}
                          loading={i < 2 ? 'eager' : 'lazy'}
                          decoding="async"
                          data-showcase-cover
                        />
                        <span className="showcase-column-tile__shine" />
                      </div>
                      <div className="showcase-column-tile__footer">
                        <span className="showcase-column-tile__icon">
                          <ColumnIcon name={column.icon} />
                        </span>
                        <div className="showcase-column-tile__copy">
                          <p className="showcase-column-tile__lede">
                            {column.tagline || `Explore ${column.title}`}
                          </p>
                        </div>
                        <span className="showcase-column-tile__meta">
                          <span>
                            {counts[column.id] || 0} live listing
                            {(counts[column.id] || 0) === 1 ? '' : 's'}
                          </span>
                          <span className="showcase-column-tile__arrow">
                            <ArrowRight size={18} aria-hidden />
                          </span>
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <EditableSection id="showcase-extra" label="Extra sections" as="div" className="section">
        <div className="container">
          <CmsExtraSections contentKey="showcase" />
        </div>
      </EditableSection>
      <div ref={curtainRef} className="showcase-transition-curtain" aria-hidden="true">
        <span>Entering the field</span>
      </div>
    </div>
  )
}

export function ShowcaseColumnPage() {
  const { slug = '' } = useParams()
  const pageRef = useRef<HTMLDivElement | null>(null)
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

  useEffect(() => {
    if (loading || !column || !pageRef.current) return

    const root = pageRef.current
    const mm = gsap.matchMedia()
    mm.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
        timeline
          .fromTo(
            '[data-column-cover]',
            { clipPath: 'inset(0 0 100% 0)' },
            { clipPath: 'inset(0 0 0% 0)', duration: 1.05, ease: 'power4.inOut' },
          )
          .fromTo(
            '[data-column-copy] > *',
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.08 },
            '-=0.58',
          )
      },
      root,
    )
    return () => mm.revert()
  }, [column, loading])

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

  const orderedListings = [
    ...listings.filter((item) => item.featured),
    ...listings.filter((item) => !item.featured),
  ]

  return (
    <div ref={pageRef} className="page showcase-page showcase-column-page">
      <section className="showcase-column-hero">
        <div className="showcase-column-hero__cover" data-column-cover>
          <img src={COLUMN_COVERS[column.slug]} alt="" />
          <span className="showcase-column-hero__cover-shade" />
        </div>
        <div className="container showcase-column-hero__layout">
          <div className="showcase-column-hero__inner" data-column-copy>
            <Link to="/showcase" className="showcase-back">
              <ArrowLeft size={16} />{' '}
              <EditableText contentKey="showcase" path="column.backLabel" as="span" />
            </Link>
            <span className="showcase-column-hero__icon">
              <ColumnIcon name={column.icon} />
            </span>
            <div>
              <EditableText
                contentKey="showcase"
                path="column.eyebrow"
                as="span"
                className="section-label"
              />
              <h1 className="display-xl">{column.title}</h1>
            </div>
            {column.tagline ? <p className="lead">{column.tagline}</p> : null}
            {column.description ? <p className="showcase-column-hero__desc">{column.description}</p> : null}
          </div>
        </div>
      </section>

      <section id="live-listings" className="section showcase-listings-section">
        <div className="container">
          {error ? (
            <p className="showcase-status showcase-status--error" role="alert">
              {error}
            </p>
          ) : listings.length === 0 ? (
            <EditableSection id="showcase-empty" label="Empty state" as="div" className="showcase-empty">
              <EditableText contentKey="showcase" path="column.emptyTitle" as="h2" />
              <EditableText contentKey="showcase" path="column.emptyBody" as="p" multiline />
              <div className="showcase-empty__actions">
                <Button to="/contact">
                  <EditableText contentKey="showcase" path="column.emptyContactLabel" as="span" />
                </Button>
                <Button to="/showcase" variant="secondary">
                  <EditableText contentKey="showcase" path="column.emptyBrowseLabel" as="span" />
                </Button>
              </div>
            </EditableSection>
          ) : (
            <div className="showcase-listings-block">
              <EditableSection
                id="showcase-listings-heading"
                label="Listings heading"
                as="div"
                className="showcase-listings-heading-wrap"
              >
                <EditableText
                  contentKey="showcase"
                  path="column.listingsEyebrow"
                  as="span"
                  className="section-label"
                />
                <h2 className="showcase-listings-heading">
                  {listings.length === 1 ? (
                    <EditableText contentKey="showcase" path="column.listingsTitleSingular" as="span" />
                  ) : (
                    <>
                      {listings.length}{' '}
                      <EditableText contentKey="showcase" path="column.listingsTitle" as="span" />
                    </>
                  )}
                </h2>
              </EditableSection>
              <div className="showcase-listings">
                {orderedListings.map((listing, i) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    columnTitle={column.title}
                    columnSlug={column.slug}
                    order={i}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export function ShowcaseListingPage() {
  const { slug, listingId } = useParams<{ slug: string; listingId: string }>()
  const [column, setColumn] = useState<ShowcaseColumn | null>(null)
  const [listing, setListing] = useState<ShowcaseListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!slug || !listingId) {
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

      if (colError || !col) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const { data: row, error: listError } = await supabase
        .from('showcase_listings')
        .select('*')
        .eq('id', listingId)
        .eq('column_id', col.id)
        .eq('status', 'published')
        .maybeSingle()

      if (cancelled) return

      if (listError || !row) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setColumn(col)
      setListing(row)
      setNotFound(false)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug, listingId])

  if (loading) {
    return (
      <div className="page showcase-page">
        <div className="container showcase-status">Loading listing…</div>
      </div>
    )
  }

  if (notFound || !column || !listing) {
    return (
      <div className="page showcase-page">
        <div className="container showcase-empty">
          <h1>Listing not found</h1>
          <p>This showcase listing is unavailable or no longer published.</p>
          <Button to={slug ? `/showcase/${slug}` : '/showcase'}>Back to Showcase</Button>
        </div>
      </div>
    )
  }

  const mailto = showcaseContactMailto(listing.title, column.title)
  const whatsapp = showcaseWhatsAppLink(COMPANY.phones[0], listing.title)

  return (
    <div className="page showcase-page showcase-listing-page">
      <section className="section showcase-listing-detail">
        <div className="container showcase-listing-detail__layout">
          <div className="showcase-listing-detail__gallery">
            <Link to={`/showcase/${column.slug}`} className="showcase-back">
              <ArrowLeft size={16} />{' '}
              <EditableText contentKey="showcase" path="listing.backLabel" as="span" />
            </Link>
            <EditableText
              contentKey="showcase"
              path="listing.galleryLabel"
              as="span"
              className="section-label"
            />
            <ShowcaseGallery
              images={listing.image_urls}
              title={listing.title}
              onZoom={(i) => setLightbox(i)}
            />
          </div>

          <div className="showcase-listing-detail__copy">
            <EditableText
              contentKey="showcase"
              path="listing.detailsEyebrow"
              as="span"
              className="section-label"
            />
            <p className="showcase-listing-detail__column">{column.title}</p>
            <h1 className="display-xl">{listing.title}</h1>
            <div className="showcase-listing-detail__meta">
              {listing.featured ? (
                <span className="showcase-card__featured-badge showcase-card__featured-badge--inline">
                  Featured
                </span>
              ) : null}
              <p className="showcase-card__deal showcase-listing-detail__deal">
                {SHOWCASE_DEAL_LABELS[listing.deal_type]}
              </p>
            </div>
            {listing.location ? (
              <p className="showcase-card__location">
                <MapPin size={16} aria-hidden /> {listing.location}
              </p>
            ) : null}
            {listing.price_label ? <p className="showcase-card__price">{listing.price_label}</p> : null}
            {listing.summary ? <p className="lead">{listing.summary}</p> : null}
            {listing.description ? (
              <p className="showcase-listing-detail__description">{listing.description}</p>
            ) : null}
            <div className="showcase-card__actions">
              <a className="btn btn--primary" href={mailto}>
                <Mail size={16} />{' '}
                <EditableText contentKey="showcase" path="listing.contactLabel" as="span" />
              </a>
              <a className="btn btn--secondary" href={whatsapp} target="_blank" rel="noreferrer">
                <Phone size={16} />{' '}
                <EditableText contentKey="showcase" path="listing.whatsappLabel" as="span" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {lightbox !== null && listing.image_urls.length > 0 ? (
        <ShowcaseLightbox
          images={listing.image_urls}
          startIndex={lightbox}
          title={listing.title}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </div>
  )
}
