import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { COMPANY } from '../../lib/constants'
import { Button } from '../ui/Button'
import './Footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__cta-band">
        <div className="container footer__cta-inner">
          <div>
            <p className="footer__cta-eyebrow">Market Sphere Group</p>
            <h2 className="footer__cta-title">{COMPANY.tagline}</h2>
            <p className="footer__cta-desc">Connecting Botswana with verified professionals across every field.</p>
          </div>
          <Button to="/register" size="lg">
            Get Started <ArrowUpRight size={16} />
          </Button>
        </div>
      </div>

      <div className="container footer__main">
        <div className="footer__grid">
          <div className="footer__brand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="footer__logo" />
            <h3>{COMPANY.shortName}</h3>
            <p className="footer__tagline">{COMPANY.mission}</p>
            <p className="footer__reg">{COMPANY.registration}</p>
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

          <div className="footer__col footer__contact">
            <h4>Reach Us</h4>
            <p><MapPin size={15} /> {COMPANY.address}</p>
            <p><Mail size={15} /> <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
            {COMPANY.phones.map((p) => (
              <p key={p}><Phone size={15} /> <a href={`tel:${p.replace(/\s/g, '')}`}>{p}</a></p>
            ))}
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>&copy; {new Date().getFullYear()} {COMPANY.name}</p>
          <p>Serving {COMPANY.operationalArea}</p>
        </div>
      </div>
    </footer>
  )
}
