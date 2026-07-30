import { FileText } from 'lucide-react'
import { LOGO_PATH } from '../../lib/constants'
import './ShowcaseTextCover.css'

type ShowcaseTextCoverProps = {
  title?: string
  className?: string
}

/** Branded cover for listings published without photos. */
export function ShowcaseTextCover({ title, className = '' }: ShowcaseTextCoverProps) {
  const base = import.meta.env.BASE_URL
  return (
    <div className={`showcase-text-cover ${className}`.trim()} aria-hidden>
      <div className="showcase-text-cover__glow" />
      <div className="showcase-text-cover__grid" />
      <div className="showcase-text-cover__content">
        <img
          src={`${base}${LOGO_PATH}`}
          alt=""
          className="showcase-text-cover__logo"
          loading="lazy"
          decoding="async"
        />
        <span className="showcase-text-cover__badge">
          <FileText size={14} aria-hidden />
          Text listing
        </span>
        {title ? <p className="showcase-text-cover__title">{title}</p> : null}
      </div>
    </div>
  )
}
