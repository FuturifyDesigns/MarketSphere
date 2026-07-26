import { Mail, Phone, User } from 'lucide-react'
import {
  showcaseHasOwnerContacts,
  showcaseOwnerMailto,
  showcaseOwnerTel,
  showcaseOwnerWhatsApp,
} from '../../lib/showcase'
import type { ShowcaseListing } from '../../lib/types'
import './ShowcaseOwnerContacts.css'

type Props = {
  listing: Pick<ShowcaseListing, 'title' | 'owner_name' | 'owner_phone' | 'owner_email'>
  compact?: boolean
}

export function ShowcaseOwnerContacts({ listing, compact = false }: Props) {
  if (!showcaseHasOwnerContacts(listing)) return null

  const name = listing.owner_name?.trim()
  const phone = listing.owner_phone?.trim()
  const email = listing.owner_email?.trim()

  return (
    <div className={`showcase-owner${compact ? ' showcase-owner--compact' : ''}`}>
      <p className="showcase-owner__label">
        <User size={14} aria-hidden /> Owner contacts
      </p>
      {name ? <p className="showcase-owner__name">{name}</p> : null}
      <div className="showcase-owner__links">
        {phone ? (
          <>
            <a className="showcase-owner__link" href={showcaseOwnerTel(phone)}>
              <Phone size={14} aria-hidden /> {phone}
            </a>
            <a
              className="showcase-owner__link showcase-owner__link--wa"
              href={showcaseOwnerWhatsApp(phone, listing.title)}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </>
        ) : null}
        {email ? (
          <a className="showcase-owner__link" href={showcaseOwnerMailto(email, listing.title)}>
            <Mail size={14} aria-hidden /> {email}
          </a>
        ) : null}
      </div>
    </div>
  )
}
