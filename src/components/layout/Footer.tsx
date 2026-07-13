import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { FUTURIFY_DESIGNS, LOGO_PATH } from '../../lib/constants'
import { useCookieConsent } from '../../context/CookieConsentContext'
import { useSiteContent } from '../../context/SiteContentContext'
import { EditableText } from '../cms/EditableText'
import { Button } from '../ui/Button'
import './Footer.css'

type CompanyBlock = {
  name: string
  shortName: string
  mission: string
  registration: string
  address: string
  email: string
  phones: string[]
  operationalArea: string
  footer?: {
    ctaEyebrow: string
    ctaTitle: string
    ctaDesc: string
  }
}

export function Footer() {
  const { openCookieSettings } = useCookieConsent()
  const { getBlock } = useSiteContent()
  const company = getBlock<CompanyBlock>('company')

  return (
    <footer className="footer">
      <div className="footer__cta-band">
        <div className="container footer__cta-inner">
          <div>
            <EditableText contentKey="company" path="footer.ctaEyebrow" as="p" className="footer__cta-eyebrow" />
            <EditableText contentKey="company" path="footer.ctaTitle" as="h2" className="footer__cta-title" />
            <EditableText contentKey="company" path="footer.ctaDesc" as="p" className="footer__cta-desc" multiline />
          </div>
          <Button to="/register" size="lg">
            Get Started <ArrowUpRight size={16} />
          </Button>
        </div>
      </div>

      <div className="container footer__main">
        <div className="footer__grid">
          <div className="footer__brand">
            <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt="" className="footer__logo" loading="eager" decoding="sync" />
            <EditableText contentKey="company" path="shortName" as="h3" />
            <EditableText contentKey="company" path="mission" as="p" className="footer__tagline" multiline />
            <EditableText contentKey="company" path="registration" as="p" className="footer__reg" />
          </div>

          <div className="footer__col">
            <h4>Platform</h4>
            <Link to="/browse">Find Providers</Link>
            <Link to="/services">Services</Link>
            <Link to="/register?role=provider">Become a Provider</Link>
            <Link to="/faq">FAQ</Link>
          </div>

          <div className="footer__col">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/login">Sign In</Link>
          </div>

          <div className="footer__col">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <button type="button" className="footer__link-btn" onClick={openCookieSettings}>
              Cookie Settings
            </button>
          </div>

          <div className="footer__col footer__contact">
            <h4>Reach Us</h4>
            <p>
              <MapPin size={15} />{' '}
              <EditableText contentKey="company" path="address" as="span" multiline />
            </p>
            <p>
              <Mail size={15} />{' '}
              <a href={`mailto:${company.email}`}>
                <EditableText contentKey="company" path="email" as="span" />
              </a>
            </p>
            {(company.phones || []).map((p, index) => (
              <p key={p}>
                <Phone size={15} />{' '}
                <a href={`tel:${p.replace(/\s/g, '')}`}>
                  <EditableText contentKey="company" path={`phones.${index}`} as="span" />
                </a>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <div className="footer__bottom-copy">
            <p>
              &copy; {new Date().getFullYear()}{' '}
              <EditableText contentKey="company" path="name" as="span" />
            </p>
            <p>
              Serving <EditableText contentKey="company" path="operationalArea" as="span" />
            </p>
          </div>
          <p className="footer__credit">
            Built by{' '}
            <a href={FUTURIFY_DESIGNS.url} target="_blank" rel="noopener noreferrer">
              {FUTURIFY_DESIGNS.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
