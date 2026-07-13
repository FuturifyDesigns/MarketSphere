import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, MapPin } from 'lucide-react'
import type { Provider } from '../../lib/types'
import { getProviderPrimaryCategory } from '../../lib/providerCategory'
import './ProviderCard.css'

interface ProviderCardProps {
  provider: Provider
  index?: number
  disableAnimation?: boolean
  variant?: 'default' | 'featured' | 'showcase'
}

export function ProviderCard({ provider, index = 0, disableAnimation = false, variant = 'default' }: ProviderCardProps) {
  const primaryCategory = getProviderPrimaryCategory(provider)
  const cardClassName =
    variant === 'showcase'
      ? 'provider-card provider-card--showcase'
      : variant === 'featured'
        ? 'provider-card provider-card--featured'
        : 'provider-card'

  const content = (
    <Link to={`/provider/${provider.id}`} className="provider-card__link">
      <div className="provider-card__image-wrap">
        {provider.logo_url ? (
          <img src={provider.logo_url} alt="" className="provider-card__image" />
        ) : (
          <div className="provider-card__placeholder">
            {provider.business_name.charAt(0)}
          </div>
        )}
        {primaryCategory ? <span className="provider-card__category">{primaryCategory.name}</span> : null}
        {variant === 'showcase' ? (
          <span className="provider-card__verified">
            <BadgeCheck size={13} aria-hidden="true" />
            Verified
          </span>
        ) : null}
      </div>
      <div className="provider-card__body">
        <h3>{provider.business_name}</h3>
        {provider.location && (
          <p className="provider-card__location">
            <MapPin size={13} /> {provider.location}
          </p>
        )}
        {provider.description && (
          <p className="provider-card__desc">
            {provider.description.slice(0, variant === 'showcase' ? 160 : 100)}
            {provider.description.length > (variant === 'showcase' ? 160 : 100) ? '…' : ''}
          </p>
        )}
        {variant === 'showcase' ? (
          <span className="provider-card__cta">
            View profile
            <ArrowRight size={15} aria-hidden="true" />
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
