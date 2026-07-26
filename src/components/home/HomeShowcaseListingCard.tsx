import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { SHOWCASE_DEAL_LABELS } from '../../lib/showcase'
import type { ShowcaseListing } from '../../lib/types'
import './HomeShowcaseListingCard.css'

type Props = {
  listing: ShowcaseListing
}

export function HomeShowcaseListingCard({ listing }: Props) {
  const column = listing.showcase_columns
  const columnSlug = column?.slug
  const cover = listing.image_urls[0]
  const detailPath = columnSlug ? `/showcase/${columnSlug}/${listing.id}` : '/showcase'

  return (
    <article className="home-showcase-listing-card">
      <Link to={detailPath} className="home-showcase-listing-card__media">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="home-showcase-listing-card__placeholder" aria-hidden="true" />
        )}
        <span className="home-showcase-listing-card__deal">{SHOWCASE_DEAL_LABELS[listing.deal_type]}</span>
        {column?.title ? (
          <span className="home-showcase-listing-card__column">{column.title}</span>
        ) : null}
      </Link>
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
