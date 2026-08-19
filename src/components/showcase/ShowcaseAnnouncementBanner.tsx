import { useState } from 'react'
import {
  Bell,
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  Mail,
  Megaphone,
  Phone,
  Pin,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  SHOWCASE_ANNOUNCEMENT_CATEGORY_LABELS,
  announcementMailto,
  announcementWhatsAppLink,
} from '../../lib/showcase'
import type { ShowcaseAnnouncement, ShowcaseAnnouncementCategory } from '../../lib/types'
import './ShowcaseAnnouncementBanner.css'

const CATEGORY_ICONS: Record<ShowcaseAnnouncementCategory, LucideIcon> = {
  job: Briefcase,
  advertisement: Megaphone,
  event: Calendar,
  notice: Bell,
  general: Megaphone,
}

function formatDeadline(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Expired'
  if (diffDays === 0) return 'Closes today'
  if (diffDays === 1) return 'Closes tomorrow'
  if (diffDays <= 7) return `Closes in ${diffDays} days`

  return `Deadline: ${date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`
}

export function ShowcaseAnnouncementCard({
  announcement,
  showColumnName = false,
}: {
  announcement: ShowcaseAnnouncement
  showColumnName?: boolean
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const Icon = CATEGORY_ICONS[announcement.category] || Megaphone
  const categoryLabel =
    SHOWCASE_ANNOUNCEMENT_CATEGORY_LABELS[announcement.category] || 'Announcement'

  const mailto = announcement.contact_email
    ? announcementMailto(announcement.contact_email, announcement)
    : null
  const whatsapp = announcement.contact_phone
    ? announcementWhatsAppLink(announcement.contact_phone, announcement)
    : null
  const tel = announcement.contact_phone
    ? `tel:${announcement.contact_phone.replace(/[^\d+]/g, '')}`
    : null

  return (
    <article
      className={`showcase-announcement-card showcase-announcement-card--${announcement.category}${
        announcement.pinned ? ' showcase-announcement-card--pinned' : ''
      }`}
    >
      {announcement.image_url ? (
        <div className="showcase-announcement-card__banner">
          <img
            src={announcement.image_url}
            alt={announcement.title}
            loading="lazy"
            decoding="async"
            onClick={() => setLightboxOpen(true)}
            style={{ cursor: 'pointer' }}
          />
        </div>
      ) : null}

      <div className="showcase-announcement-card__inner">
        <div className="showcase-announcement-card__header">
          <div className="showcase-announcement-card__badges">
            <span
              className={`showcase-announcement-badge showcase-announcement-badge--category-${announcement.category}`}
            >
              <Icon size={12} aria-hidden />
              {categoryLabel}
            </span>
            {announcement.badge ? (
              <span className="showcase-announcement-badge showcase-announcement-badge--custom">
                {announcement.badge}
              </span>
            ) : null}
            {announcement.pinned ? (
              <span className="showcase-announcement-badge showcase-announcement-badge--pinned">
                <Pin size={11} aria-hidden /> Pinned
              </span>
            ) : null}
          </div>
        </div>

        {showColumnName && announcement.showcase_columns?.title ? (
          <span className="showcase-announcement-card__column-tag">
            {announcement.showcase_columns.title}
          </span>
        ) : null}

        <h3 className="showcase-announcement-card__title">{announcement.title}</h3>

        <p className="showcase-announcement-card__body">{announcement.body}</p>

        {announcement.expires_at ? (
          <div className="showcase-announcement-card__deadline">
            <Clock size={13} aria-hidden />
            <span>{formatDeadline(announcement.expires_at)}</span>
          </div>
        ) : null}

        <div className="showcase-announcement-card__actions">
          {announcement.link_url ? (
            <a
              href={announcement.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--sm"
            >
              <ExternalLink size={13} />
              {announcement.link_label?.trim() ||
                (announcement.category === 'job' ? 'Apply Now' : 'Learn More')}
            </a>
          ) : null}

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary btn--sm"
            >
              <Phone size={13} />
              WhatsApp
            </a>
          ) : null}

          {tel && !whatsapp ? (
            <a href={tel} className="btn btn--secondary btn--sm">
              <Phone size={13} />
              Call
            </a>
          ) : null}

          {mailto ? (
            <a href={mailto} className="btn btn--ghost btn--sm">
              <Mail size={13} />
              Email
            </a>
          ) : null}
        </div>
      </div>

      {lightboxOpen && announcement.image_url ? (
        <div
          className="showcase-lightbox"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={announcement.title}
        >
          <button
            type="button"
            className="showcase-lightbox__close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div className="showcase-lightbox__stage" onClick={(e) => e.stopPropagation()}>
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="showcase-lightbox__img"
            />
          </div>
        </div>
      ) : null}
    </article>
  )
}

export function ShowcaseAnnouncementBanner({
  announcements,
  title = 'Featured Announcements & Advertisements',
  showColumnName = false,
}: {
  announcements: ShowcaseAnnouncement[]
  title?: string
  showColumnName?: boolean
}) {
  if (!announcements || announcements.length === 0) return null

  return (
    <div className="showcase-announcements-section">
      <div className="showcase-announcements-heading">
        <h3>
          <Megaphone size={18} aria-hidden />
          {title}
        </h3>
      </div>
      <div
        className={`showcase-announcements-grid${
          announcements.length > 1 ? ' showcase-announcements-grid--multiple' : ''
        }`}
      >
        {announcements.map((announcement) => (
          <ShowcaseAnnouncementCard
            key={announcement.id}
            announcement={announcement}
            showColumnName={showColumnName}
          />
        ))}
      </div>
    </div>
  )
}
