import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import type { Provider } from '../../lib/types'
import './ProviderCard.css'

interface ProviderCardProps {
  provider: Provider
  index?: number
  disableAnimation?: boolean
}

export function ProviderCard({ provider, index = 0, disableAnimation = false }: ProviderCardProps) {
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
            {provider.description.slice(0, 100)}
            {provider.description.length > 100 ? '…' : ''}
          </p>
        )}
      </div>
    </Link>
  )

  if (disableAnimation) {
    return <article className="provider-card">{content}</article>
  }

  return (
    <motion.article
      className="provider-card"
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
