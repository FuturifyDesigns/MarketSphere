import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { COMPANY, LOGO_PATH } from '../../lib/constants'
import { preloadServiceVideos } from '../../lib/serviceVideoCache'
import { Button } from '../ui/Button'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/browse', label: 'Providers' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const dashboardPath =
    profile?.role === 'admin'
      ? '/dashboard/admin'
      : profile?.role === 'provider'
        ? '/dashboard/provider'
        : '/dashboard/customer'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt={COMPANY.shortName} className="navbar__logo" loading="eager" decoding="sync" fetchPriority="high" />
          <span className="navbar__name">{COMPANY.shortName}</span>
        </Link>

        <nav className={`navbar__nav ${open ? 'navbar__nav--open' : ''}`}>
          <div className="navbar__pill">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar__link ${location.pathname === link.to ? 'navbar__link--active' : ''}`}
                onClick={() => setOpen(false)}
                onMouseEnter={link.to === '/services' ? () => void preloadServiceVideos() : undefined}
                onFocus={link.to === '/services' ? () => void preloadServiceVideos() : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="navbar__actions">
          {profile ? (
            <>
              <Link to={dashboardPath} className="navbar__dash">Dashboard</Link>
              <button className="navbar__signout" onClick={() => signOut()}>Sign Out</button>
            </>
          ) : (
            <Button to="/get-started" size="sm">Get Started</Button>
          )}
          <button className="navbar__toggle" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
