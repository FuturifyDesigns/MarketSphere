import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  MarketIconExplore,
  MarketIconGallery,
  MarketIconLive,
  MarketIconServices,
  MarketIconVerifiedTrust,
} from '../components/icons/MarketIcons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { GallerySlideshow } from '../components/ui/GallerySlideshow'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  validateMessage,
  validateSubject,
  type FieldErrors,
} from '../lib/validation'
import { isProfileBanned } from '../lib/accountGuard'
import type { Provider } from '../lib/types'
import { getProviderPrimaryCategory } from '../lib/providerCategory'
import { displayName, initialLetter } from '../lib/safe'
import { useSubmitLock } from '../hooks/useSubmitLock'
import './ProviderProfile.css'
import '../components/ui/GallerySlideshow.css'

type EnquiryFields = 'subject' | 'message'

export function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [enquiry, setEnquiry] = useState({ subject: '', message: '' })
  const [enquiryErrors, setEnquiryErrors] = useState<FieldErrors<EnquiryFields>>({})
  const [enquiryError, setEnquiryError] = useState('')
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { locked: enquiryLocked, runLocked: runEnquiryLocked } = useSubmitLock()
  const { locked: favoriteLocked, runLocked: runFavoriteLocked } = useSubmitLock()

  const gallery = provider?.gallery_urls || []
  const serviceCount = provider?.provider_services?.length || 0
  const coverImage = provider?.cover_url || gallery[0] || provider?.logo_url || null
  const primaryCategory = provider ? getProviderPrimaryCategory(provider) : null
  const businessLabel = displayName(provider?.business_name, 'Provider')

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function loadProvider() {
      try {
        const { data: providerData, error } = await supabase
          .from('providers')
          .select('*, provider_services(*, categories(*))')
          .eq('id', id)
          .maybeSingle()

        if (cancelled) return
        if (error) {
          console.error('[provider-profile] load', error)
          setProvider(null)
        } else {
          setProvider(providerData)
        }
        setLoading(false)
      } catch (error) {
        console.error('[provider-profile] load threw', error)
        if (!cancelled) {
          setProvider(null)
          setLoading(false)
        }
      }
    }

    void loadProvider()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    supabase
      .from('favorites')
      .select('*')
      .eq('customer_id', user.id)
      .eq('provider_id', id)
      .maybeSingle()
      .then(({ data }) => setIsFavorite(!!data))
  }, [user, id])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null)
      if (event.key === 'ArrowRight') setLightboxIndex((current) => (current === null ? null : (current + 1) % gallery.length))
      if (event.key === 'ArrowLeft') {
        setLightboxIndex((current) =>
          current === null ? null : (current - 1 + gallery.length) % gallery.length,
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, gallery.length])

  const toggleFavorite = async () => {
    if (!user || !id || favoriteLocked) return
    await runFavoriteLocked(async () => {
      try {
        if (isFavorite) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('customer_id', user.id)
            .eq('provider_id', id)
          if (error) {
            showToast('Could not remove saved provider.', 'error')
            return
          }
          setIsFavorite(false)
          showToast('Removed from saved providers.')
        } else {
          const { error } = await supabase
            .from('favorites')
            .insert({ customer_id: user.id, provider_id: id })
          if (error) {
            showToast('Could not save provider.', 'error')
            return
          }
          setIsFavorite(true)
          showToast('Provider saved to your favourites.')
        }
      } catch {
        showToast('Could not update favourites. Please try again.', 'error')
      }
    })
  }

  const submitEnquiry = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !id || submittingEnquiry || enquiryLocked) return
    if (isProfileBanned(profile)) {
      setEnquiryError('Your account is suspended and cannot send enquiries.')
      return
    }
    setEnquiryError('')

    const errors = collectErrors<EnquiryFields>([
      ['subject', validateSubject(enquiry.subject)],
      ['message', validateMessage(enquiry.message)],
    ])
    setEnquiryErrors(errors)
    if (hasErrors(errors)) return

    await runEnquiryLocked(async () => {
      setSubmittingEnquiry(true)
      try {
        const { error } = await supabase.from('enquiries').insert({
          customer_id: user.id,
          provider_id: id,
          subject: enquiry.subject.trim(),
          message: enquiry.message.trim(),
        })

        if (error) {
          setEnquiryError('Could not send enquiry. Please try again.')
          showToast('Could not send enquiry. Please try again.', 'error')
          return
        }

        setEnquiry({ subject: '', message: '' })
        setEnquiryErrors({})
        setShowEnquiry(false)
        showToast('Enquiry sent successfully. The provider has been notified.')
        navigate('/dashboard/customer', { state: { enquirySent: true } })
      } catch {
        setEnquiryError('Could not send enquiry. Please try again.')
        showToast('Could not send enquiry. Please try again.', 'error')
      } finally {
        setSubmittingEnquiry(false)
      }
    })
  }

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>
  if (!provider) return <div className="container section"><p>Provider not found.</p></div>

  const canEnquire = user && profile?.role === 'customer' && !isProfileBanned(profile)

  return (
    <div className="page provider-profile-page">
      <section className="provider-showcase-hero">
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            className="provider-showcase-hero__cover"
            decoding="async"
            fetchPriority="high"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="provider-showcase-hero__cover provider-showcase-hero__cover--fallback" aria-hidden="true" />
        )}
        <div className="provider-showcase-hero__scrim" aria-hidden="true" />
        <div className="container provider-showcase-hero__inner">
          <motion.div
            className="provider-showcase-hero__card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="provider-showcase-hero__brand">
              <div className="provider-showcase-hero__logo">
                {provider.logo_url ? (
                  <img src={provider.logo_url} alt="" decoding="async" />
                ) : (
                  <div className="provider-showcase-hero__logo-placeholder">
                    {initialLetter(provider.business_name)}
                  </div>
                )}
              </div>
              <div className="provider-showcase-hero__intro">
                <span className="provider-showcase-hero__badge">
                  <BadgeCheck size={14} aria-hidden="true" />
                  Verified provider
                </span>
                {primaryCategory ? (
                  <span className="provider-showcase-hero__category">{primaryCategory.name}</span>
                ) : null}
                <h1>{businessLabel}</h1>
                {provider.location ? (
                  <p className="provider-showcase-hero__location">
                    <MapPin size={16} aria-hidden="true" />
                    {provider.location}
                  </p>
                ) : null}
                {provider.description ? (
                  <p className="provider-showcase-hero__tagline">{provider.description}</p>
                ) : null}
              </div>
            </div>

            <div className="provider-showcase-hero__stats">
              <div className="provider-showcase-hero__stat">
                <span className="provider-showcase-hero__stat-icon" aria-hidden="true">
                  <MarketIconServices size={18} />
                </span>
                <strong>{serviceCount}</strong>
                <span>Services</span>
              </div>
              <div className="provider-showcase-hero__stat">
                <span className="provider-showcase-hero__stat-icon" aria-hidden="true">
                  <MarketIconGallery size={18} />
                </span>
                <strong>{gallery.length}</strong>
                <span>Gallery</span>
              </div>
              <div className="provider-showcase-hero__stat">
                <span className="provider-showcase-hero__stat-icon" aria-hidden="true">
                  <MarketIconLive size={18} />
                </span>
                <strong>Live</strong>
                <span>Listing</span>
              </div>
            </div>

            <div className="provider-showcase-hero__actions">
              {canEnquire ? (
                <>
                  <Button size="lg" onClick={() => setShowEnquiry(true)}>
                    <MessageSquare size={18} />
                    Send enquiry
                  </Button>
                  <button type="button" className="provider-showcase-hero__save" onClick={() => void toggleFavorite()}>
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? 'Saved' : 'Save provider'}
                  </button>
                </>
              ) : !user ? (
                <Button to="/login" size="lg">Sign in to enquire</Button>
              ) : (
                <Button to="/browse" variant="secondary" size="lg">Browse more providers</Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section provider-showcase-body">
        <div className="container provider-showcase-grid">
          <div className="provider-showcase-main">
            {provider.description ? (
              <article className="provider-showcase-panel">
                <h2>About this business</h2>
                <p>{provider.description}</p>
              </article>
            ) : null}

            {provider.provider_services && provider.provider_services.length > 0 ? (
              <article className="provider-showcase-panel">
                <div className="provider-showcase-panel__header">
                  <h2>Services offered</h2>
                  <span>{serviceCount} listed</span>
                </div>
                <div className="provider-showcase-services">
                  {provider.provider_services.map((service, index) => (
                    <motion.div
                      key={service.id}
                      className="provider-showcase-service"
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                    >
                      <div className="provider-showcase-service__top">
                        <h3>{service.title}</h3>
                        {service.categories ? (
                          <span className="provider-showcase-service__tag">{service.categories.name}</span>
                        ) : null}
                      </div>
                      {service.description ? <p>{service.description}</p> : null}
                    </motion.div>
                  ))}
                </div>
              </article>
            ) : null}

            {gallery.length > 0 ? (
              <article className="provider-showcase-panel">
                <div className="provider-showcase-panel__header">
                  <h2>Gallery</h2>
                  <span>Auto-playing slideshow · tap to enlarge</span>
                </div>
                <GallerySlideshow images={gallery} onImageClick={(index) => setLightboxIndex(index)} />
              </article>
            ) : null}
          </div>

          <aside className="provider-showcase-sidebar">
            <div className="provider-showcase-contact">
              <h3>Get in touch</h3>
              <p>Reach out directly or send an enquiry through Market Sphere Group.</p>
              {provider.contact_email ? (
                <a href={`mailto:${provider.contact_email}`} className="provider-showcase-contact__link">
                  <span className="provider-showcase-contact__icon" aria-hidden="true">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  {provider.contact_email}
                </a>
              ) : null}
              {provider.contact_phone ? (
                <a href={`tel:${provider.contact_phone}`} className="provider-showcase-contact__link">
                  <span className="provider-showcase-contact__icon" aria-hidden="true">
                    <Phone size={16} strokeWidth={2} />
                  </span>
                  {provider.contact_phone}
                </a>
              ) : null}
              {canEnquire ? (
                <Button className="provider-showcase-contact__cta" onClick={() => setShowEnquiry(true)}>
                  Send enquiry
                </Button>
              ) : !user ? (
                <Button className="provider-showcase-contact__cta" to="/login">
                  Sign in to enquire
                </Button>
              ) : null}
            </div>

            <div className="provider-showcase-promo">
              <span className="provider-showcase-promo__icon" aria-hidden="true">
                <MarketIconVerifiedTrust size={20} />
              </span>
              <strong>Trusted on Market Sphere Group</strong>
              <p>Verified listings help customers discover quality services across Botswana.</p>
              <Link to="/browse" className="provider-showcase-promo__link">
                <MarketIconExplore size={16} />
                Explore more providers
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {canEnquire ? (
        <div className="provider-showcase-mobile-cta">
          <Button size="lg" onClick={() => setShowEnquiry(true)}>Send enquiry</Button>
        </div>
      ) : null}

      <AnimatePresence>
        {showEnquiry ? (
          <motion.div
            className="modal-overlay provider-enquiry-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowEnquiry(false)}
          >
            <motion.div
              className="provider-enquiry-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="enquiry-modal-title"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="provider-enquiry-modal__close"
                onClick={() => setShowEnquiry(false)}
                aria-label="Close enquiry form"
              >
                <X size={18} aria-hidden="true" />
              </button>

              <div className="provider-enquiry-modal__header">
                <div className="provider-enquiry-modal__provider">
                  <div className="provider-enquiry-modal__avatar" aria-hidden="true">
                    {provider.logo_url ? (
                      <img src={provider.logo_url} alt="" decoding="async" />
                    ) : (
                      <span>{initialLetter(provider.business_name)}</span>
                    )}
                  </div>
                  <div className="provider-enquiry-modal__intro">
                    <span className="provider-enquiry-modal__eyebrow">
                      <MessageSquare size={14} aria-hidden="true" />
                      Send enquiry
                    </span>
                    <h2 id="enquiry-modal-title">{businessLabel}</h2>
                    {provider.location ? (
                      <p className="provider-enquiry-modal__location">
                        <MapPin size={14} aria-hidden="true" />
                        {provider.location}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="provider-enquiry-modal__lead">
                  Share what you&apos;re looking for — {businessLabel} will be notified
                  instantly and you can track the reply in your dashboard.
                </p>
              </div>

              <form className="provider-enquiry-modal__form" onSubmit={submitEnquiry} noValidate>
                <Input
                  className="provider-enquiry-modal__field"
                  label="Subject"
                  placeholder="e.g. Quote for bedroom set"
                  value={enquiry.subject}
                  onChange={(e) => {
                    setEnquiry({ ...enquiry, subject: e.target.value })
                    setEnquiryErrors((prev) => clearFieldError(prev, 'subject'))
                  }}
                  hint={FIELD_HINTS.subject}
                  error={enquiryErrors.subject}
                />
                <Textarea
                  className="provider-enquiry-modal__field"
                  label="Your message"
                  rows={5}
                  placeholder="Tell them about your needs, timeline, or any questions you have…"
                  value={enquiry.message}
                  onChange={(e) => {
                    setEnquiry({ ...enquiry, message: e.target.value })
                    setEnquiryErrors((prev) => clearFieldError(prev, 'message'))
                  }}
                  hint={FIELD_HINTS.message}
                  error={enquiryErrors.message}
                />
                {enquiryError ? <p className="provider-enquiry-modal__error" role="alert">{enquiryError}</p> : null}
                <div className="provider-enquiry-modal__actions">
                  <Button type="button" variant="ghost" onClick={() => setShowEnquiry(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="lg" disabled={submittingEnquiry || enquiryLocked} className="provider-enquiry-modal__submit">
                    {submittingEnquiry ? (
                      'Sending…'
                    ) : (
                      <>
                        <Send size={17} aria-hidden="true" />
                        Send enquiry
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <p className="provider-enquiry-modal__trust">
                <ShieldCheck size={15} aria-hidden="true" />
                Secure &amp; private · Delivered through Market Sphere Group
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {lightboxIndex !== null && gallery[lightboxIndex] ? (
        <div className="provider-lightbox" role="dialog" aria-modal="true" aria-label="Gallery preview">
          <button type="button" className="provider-lightbox__backdrop" aria-label="Close gallery" onClick={() => setLightboxIndex(null)} />
          <div className="provider-lightbox__content">
            <button type="button" className="provider-lightbox__close" onClick={() => setLightboxIndex(null)} aria-label="Close">
              <X size={20} />
            </button>
            {gallery.length > 1 ? (
              <button
                type="button"
                className="provider-lightbox__nav provider-lightbox__nav--prev"
                onClick={() => setLightboxIndex((current) => (current === null ? 0 : (current - 1 + gallery.length) % gallery.length))}
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} />
              </button>
            ) : null}
            <img src={gallery[lightboxIndex]} alt="" className="provider-lightbox__image" />
            {gallery.length > 1 ? (
              <button
                type="button"
                className="provider-lightbox__nav provider-lightbox__nav--next"
                onClick={() => setLightboxIndex((current) => (current === null ? 0 : (current + 1) % gallery.length))}
                aria-label="Next photo"
              >
                <ChevronRight size={22} />
              </button>
            ) : null}
            <p className="provider-lightbox__counter">
              {lightboxIndex + 1} / {gallery.length}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
