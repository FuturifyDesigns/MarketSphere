import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { COMPANY } from '../../lib/constants'
import './Footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="footer__logo" />
          <h3>{COMPANY.shortName}</h3>
          <p className="footer__tagline">{COMPANY.tagline}</p>
          <p className="footer__reg">{COMPANY.registration}</p>
        </div>

        <div className="footer__col">
          <h4>Explore</h4>
          <Link to="/about">About Us</Link>
          <Link to="/services">Our Services</Link>
          <Link to="/browse">Find Providers</Link>
          <Link to="/faq">FAQ</Link>
        </div>

        <div className="footer__col">
          <h4>Get Involved</h4>
          <Link to="/register">Register as Customer</Link>
          <Link to="/register?role=provider">Become a Provider</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        <div className="footer__col footer__contact">
          <h4>Contact</h4>
          <p><MapPin size={14} /> {COMPANY.address}</p>
          <p><Mail size={14} /> <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
          {COMPANY.phones.map((p) => (
            <p key={p}><Phone size={14} /> <a href={`tel:${p.replace(/\s/g, '')}`}>{p}</a></p>
          ))}
        </div>
      </div>

      <div className="footer__bottom container">
        <p>&copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>
        <p className="footer__area">Serving {COMPANY.operationalArea}</p>
      </div>
    </footer>
  )
}
