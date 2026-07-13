import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'
import { useCookieConsent } from '../../context/CookieConsentContext'
import './CookieBanner.css'

export function CookieBanner() {
  const { bannerOpen, acceptCookies, declineCookies, consent } = useCookieConsent()

  if (!bannerOpen) return null

  return (
    <div className="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title" aria-modal="false">
      <div className="cookie-banner__panel">
        <div className="cookie-banner__icon" aria-hidden="true">
          <Cookie size={22} strokeWidth={2} />
        </div>
        <div className="cookie-banner__content">
          <h2 id="cookie-banner-title">Cookie preferences</h2>
          <p>
            We use essential cookies to keep you signed in and remember your choices. With your
            permission, we may also use optional cookies to improve the platform. This processing
            is handled in line with Botswana&apos;s Data Protection Act, 2024.
          </p>
          <p className="cookie-banner__links">
            Read our <Link to="/privacy">Privacy Policy</Link> and{' '}
            <Link to="/privacy#cookies">cookie notice</Link> for details. You can change your
            choice at any time via Cookie Settings in the footer.
          </p>
          {consent ? (
            <p className="cookie-banner__current">
              Current choice: <strong>{consent.preference === 'accepted' ? 'Accepted' : 'Declined'}</strong>
            </p>
          ) : null}
        </div>
        <div className="cookie-banner__actions">
          <button type="button" className="cookie-banner__btn cookie-banner__btn--decline" onClick={declineCookies}>
            Decline optional
          </button>
          <button type="button" className="cookie-banner__btn cookie-banner__btn--accept" onClick={acceptCookies}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
