import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BriefcaseBusiness, Images, Mail, MapPin, Phone } from 'lucide-react'
import type { Provider } from '../../lib/types'
import { getProviderPrimaryCategory } from '../../lib/providerCategory'
import { ProviderCardGallery } from './ProviderCardGallery'
import './ProviderCard.css'

interface ProviderCardProps {
  provider: Provider
  index?: number
  disableAnimation?: boolean
  variant?: 'default' | 'featured' | 'showcase'
}

function getSlideImages(provider: Provider) {
  const slides: string[] = []
  const seen = new Set<string>()

  const add = (url: string | null | undefined) => {
    if (!url || seen.has(url)) return
    seen.add(url)
    slides.push(url)
  }

  add(provider.cover_url)
  for (const url of provider.gallery_urls || []) add(url)
  if (!slides.length) add(provider.logo_url)

  return slides
}

function getServiceTitles(provider: Provider, limit = 3) {
  return (provider.provider_services || [])
    .map((service) => service.title.trim())
    .filter(Boolean)
    .slice(0, limit)
}

export function ProviderCard({ provider, index = 0, disableAnimation = false, variant = 'default' }: ProviderCardProps) {
  const primaryCategory = getProviderPrimaryCategory(provider)
  const slideImages = getSlideImages(provider)
  const cardImage = slideImages[0] || null
  const serviceCount = provider.provider_services?.length || 0
  const galleryCount = provider.gallery_urls?.length || 0
  const serviceTitles = getServiceTitles(provider, variant === 'showcase' ? 3 : 2)
  const descLimit = variant === 'showcase' ? 220 : variant === 'featured' ? 120 : 100
  const useGallery = variant === 'showcase' && slideImages.length > 1

  const cardClassName =
    variant === 'showcase'
      ? 'provider-card provider-card--showcase'
      : variant === 'featured'
        ? 'provider-card provider-card--featured'
        : 'provider-card'

  const content = (
    <Link to={`/provider/${provider.id}`} className="provider-card__link">
      <div className="provider-card__image-wrap">
        {useGallery ? (
          <ProviderCardGallery images={slideImages} />
        ) : cardImage ? (
          <img src={cardImage} alt="" className="provider-card__image" />
        ) : (
          <div className="provider-card__placeholder">
            {provider.business_name.charAt(0)}
          </div>
        )}

        {primaryCategory ? <span className="provider-card__category">{primaryCategory.name}</span> : null}

        {provider.logo_url && cardImage !== provider.logo_url ? (
          <img src={provider.logo_url} alt="" className="provider-card__logo-badge" />
        ) : null}

        {variant === 'showcase' ? (
          <div className="provider-card__image-overlay">
            <p className="provider-card__image-overlay-name">{provider.business_name}</p>
            {provider.location ? (
              <p className="provider-card__image-overlay-location">
                <MapPin size={15} aria-hidden="true" />
                {provider.location}
              </p>
            ) : null}
            {provider.contact_phone ? (
              <p className="provider-card__image-overlay-contact">
                <Phone size={15} aria-hidden="true" />
                {provider.contact_phone}
              </p>
            ) : null}
            {provider.contact_email ? (
              <p className="provider-card__image-overlay-contact">
                <Mail size={15} aria-hidden="true" />
                {provider.contact_email}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="provider-card__body">
        <h3>{provider.business_name}</h3>
        {provider.location && (
          <p className="provider-card__location">
            <MapPin size={14} /> {provider.location}
          </p>
        )}

        {(variant === 'showcase' || variant === 'featured') && (serviceCount > 0 || galleryCount > 0) ? (
          <div className="provider-card__meta">
            {serviceCount > 0 ? (
              <span className="provider-card__meta-item">
                <BriefcaseBusiness size={14} aria-hidden="true" />
                {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
              </span>
            ) : null}
            {galleryCount > 0 ? (
              <span className="provider-card__meta-item">
                <Images size={14} aria-hidden="true" />
                {galleryCount} {galleryCount === 1 ? 'photo' : 'photos'}
              </span>
            ) : null}
          </div>
        ) : null}

        {serviceTitles.length > 0 ? (
          <ul className="provider-card__services" aria-label="Services offered">
            {serviceTitles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        ) : null}

        {provider.description && (
          <p className="provider-card__desc">
            {provider.description.slice(0, descLimit)}
            {provider.description.length > descLimit ? '…' : ''}
          </p>
        )}

        {variant === 'showcase' && (provider.contact_phone || provider.contact_email) ? (
          <div className="provider-card__contact">
            {provider.contact_phone ? (
              <span className="provider-card__contact-item">
                <Phone size={15} aria-hidden="true" />
                {provider.contact_phone}
              </span>
            ) : null}
            {provider.contact_email ? (
              <span className="provider-card__contact-item">
                <Mail size={15} aria-hidden="true" />
                {provider.contact_email}
              </span>
            ) : null}
          </div>
        ) : null}

        {variant === 'default' && serviceCount > 0 ? (
          <p className="provider-card__service-count">
            <BriefcaseBusiness size={12} aria-hidden="true" />
            {serviceCount} {serviceCount === 1 ? 'service listed' : 'services listed'}
          </p>
        ) : null}

        {variant === 'showcase' ? (
          <span className="provider-card__cta">
            View profile
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </Link>
  )

  if (disableAnimation) {
    return <article className={cardClassName}>{content}</article>
  }

  return (
    <motion.article
      className={cardClassName}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
    >
      {content}
    </motion.article>
  )
}
