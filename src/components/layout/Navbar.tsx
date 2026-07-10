import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/browse', label: 'Find Providers' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const dashboardPath =
    profile?.role === 'admin'
      ? '/dashboard/admin'
      : profile?.role === 'provider'
        ? '/dashboard/provider'
        : '/dashboard/customer'

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MarketSphere" className="navbar__logo" />
          <span className="navbar__name">MarketSphere</span>
        </Link>

        <nav className={`navbar__nav ${open ? 'navbar__nav--open' : ''}`}>
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
        </nav>

        <div className="navbar__actions">
          {profile ? (
            <>
              <Link to={dashboardPath} className="navbar__link navbar__dashboard">
                Dashboard
              </Link>
              <button className="navbar__signout" onClick={() => signOut()}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                Sign In
              </Button>
              <Button to="/register" size="sm">
                Get Started
              </Button>
            </>
          )}
          <button className="navbar__toggle" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
