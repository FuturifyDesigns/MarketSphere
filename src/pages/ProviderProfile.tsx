import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Heart,
  Images,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  X,
} from 'lucide-react'
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
import type { Provider } from '../lib/types'
import { getProviderPrimaryCategory, ensureProviderCategoryIfNeeded } from '../lib/providerCategory'
import './ProviderProfile.css'
import '../components/ui/GallerySlideshow.css'

type EnquiryFields = 'subject' | 'message'

export function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
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

  const gallery = provider?.gallery_urls || []
  const serviceCount = provider?.provider_services?.length || 0
  const coverImage = gallery[0] || provider?.logo_url || null
  const primaryCategory = provider ? getProviderPrimaryCategory(provider) : null

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function loadProvider() {
      const [{ data: providerData }, { data: categoryRows }] = await Promise.all([
        supabase
          .from('providers')
          .select('*, provider_services(*, categories(*))')
          .eq('id', id)
          .single(),
        supabase.from('categories').select('*').order('sort_order'),
      ])

      if (cancelled) return

      const categories = categoryRows || []
      const provider = providerData
        ? await ensureProviderCategoryIfNeeded(providerData, categories)
        : null

      setProvider(provider)
      setLoading(false)
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
    if (!user || !id) return
    if (isFavorite) {
      const { error } = await supabase.from('favorites').delete().eq('customer_id', user.id).eq('provider_id', id)
      if (error) {
        showToast('Could not remove saved provider.', 'error')
        return
      }
      setIsFavorite(false)
      showToast('Removed from saved providers.')
    } else {
      const { error } = await supabase.from('favorites').insert({ customer_id: user.id, provider_id: id })
      if (error) {
        showToast('Could not save provider.', 'error')
        return
      }
      setIsFavorite(true)
      showToast('Provider saved to your favourites.')
    }
  }

  const submitEnquiry = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !id) return
    setEnquiryError('')

    const errors = collectErrors<EnquiryFields>([
      ['subject', validateSubject(enquiry.subject)],
      ['message', validateMessage(enquiry.message)],
    ])
    setEnquiryErrors(errors)
    if (hasErrors(errors)) return

    setSubmittingEnquiry(true)
    const { error } = await supabase.from('enquiries').insert({
      customer_id: user.id,
      provider_id: id,
      subject: enquiry.subject.trim(),
      message: enquiry.message.trim(),
    })
    setSubmittingEnquiry(false)

    if (error) {
      setEnquiryError('Could not send enquiry. Please try again.')
      showToast('Could not send enquiry. Please try again.', 'error')
      return
    }

    setEnquiry({ subject: '', message: '' })
    setEnquiryErrors({})
    setShowEnquiry(false)
    showToast('Enquiry sent successfully. The provider will be in touch soon.')
  }

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>
  if (!provider) return <div className="container section"><p>Provider not found.</p></div>

  const canEnquire = user && profile?.role === 'customer'

  return (
    <div className="page provider-profile-page">
      <section className="provider-showcase-hero">
        {coverImage ? (
          <img src={coverImage} alt="" className="provider-showcase-hero__cover" />
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
                  <img src={provider.logo_url} alt="" />
                ) : (
                  <div className="provider-showcase-hero__logo-placeholder">
                    {provider.business_name.charAt(0)}
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
                <h1>{provider.business_name}</h1>
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
                <BriefcaseBusiness size={18} aria-hidden="true" />
                <strong>{serviceCount}</strong>
                <span>Services</span>
              </div>
              <div className="provider-showcase-hero__stat">
                <Images size={18} aria-hidden="true" />
                <strong>{gallery.length}</strong>
                <span>Gallery</span>
              </div>
              <div className="provider-showcase-hero__stat">
                <Sparkles size={18} aria-hidden="true" />
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
                  <Mail size={16} aria-hidden="true" />
                  {provider.contact_email}
                </a>
              ) : null}
              {provider.contact_phone ? (
                <a href={`tel:${provider.contact_phone}`} className="provider-showcase-contact__link">
                  <Phone size={16} aria-hidden="true" />
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
              <Sparkles size={18} aria-hidden="true" />
              <strong>Trusted on Market Sphere Group</strong>
              <p>Verified listings help customers discover quality services across Botswana.</p>
              <Link to="/browse">Explore more providers</Link>
            </div>
          </aside>
        </div>
      </section>

      {canEnquire ? (
        <div className="provider-showcase-mobile-cta">
          <Button size="lg" onClick={() => setShowEnquiry(true)}>Send enquiry</Button>
        </div>
      ) : null}

      {showEnquiry ? (
        <div className="modal-overlay" onClick={() => setShowEnquiry(false)}>
          <div className="modal provider-enquiry-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Send enquiry to {provider.business_name}</h2>
            <form onSubmit={submitEnquiry} noValidate>
              <Input
                label="Subject"
                value={enquiry.subject}
                onChange={(e) => {
                  setEnquiry({ ...enquiry, subject: e.target.value })
                  setEnquiryErrors((prev) => clearFieldError(prev, 'subject'))
                }}
                hint={FIELD_HINTS.subject}
                error={enquiryErrors.subject}
              />
              <Textarea
                label="Message"
                rows={4}
                value={enquiry.message}
                onChange={(e) => {
                  setEnquiry({ ...enquiry, message: e.target.value })
                  setEnquiryErrors((prev) => clearFieldError(prev, 'message'))
                }}
                hint={FIELD_HINTS.message}
                error={enquiryErrors.message}
              />
              {enquiryError ? <p className="upload-error" role="alert">{enquiryError}</p> : null}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowEnquiry(false)}>Cancel</Button>
                <Button type="submit" disabled={submittingEnquiry}>
                  {submittingEnquiry ? 'Sending…' : 'Send enquiry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
