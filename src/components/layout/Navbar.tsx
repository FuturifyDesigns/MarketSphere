import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { BrandLogo } from '../ui/BrandLogo'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/browse', label: 'Providers' },
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
          <BrandLogo className="navbar__logo" alt="MarketSphere" />
          <span className="navbar__name">MarketSphere</span>
        </Link>

        <nav className={`navbar__nav ${open ? 'navbar__nav--open' : ''}`}>
          <div className="navbar__pill">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar__link ${location.pathname === link.to ? 'navbar__link--active' : ''}`}
                onClick={() => setOpen(false)}
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
            <>
              <Button to="/login" variant="ghost" size="sm">Sign In</Button>
              <Button to="/register" size="sm">Get Started</Button>
            </>
          )}
          <button className="navbar__toggle" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
