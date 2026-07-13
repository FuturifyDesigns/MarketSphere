import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { COMPANY, LOGO_PATH } from '../../lib/constants'
import { preloadServiceVideos } from '../../lib/serviceVideoCache'
import { Button } from '../ui/Button'
import { NotificationBell } from '../notifications/NotificationBell'
import './Navbar.css'

function profileInitials(name: string | null | undefined, email: string | undefined) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
  }
  return email?.charAt(0).toUpperCase() || '?'
}

function SessionAvatar({
  avatarUrl,
  name,
  email,
}: {
  avatarUrl: string | null | undefined
  name: string | null | undefined
  email: string | undefined
}) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="navbar__session-avatar" />
  }

  return (
    <div className="navbar__session-avatar navbar__session-avatar--placeholder" aria-hidden="true">
      {profileInitials(name, email)}
    </div>
  )
}

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
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const dashboardPath =
    profile?.role === 'admin'
      ? '/dashboard/admin'
      : profile?.role === 'provider'
        ? '/dashboard/provider'
        : '/dashboard/customer'

  const isHome = location.pathname === '/'
  const isProviderProfile = location.pathname.startsWith('/provider/')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  const signedInName = profile?.full_name?.trim() || profile?.email || 'Account'
  const useInverseNav = isProviderProfile && !scrolled
  const useSolidNav = isProviderProfile ? scrolled : (scrolled || !isHome)

  const handleSignOut = async () => {
    setOpen(false)
    if (location.pathname.startsWith('/dashboard')) {
      navigate('/')
    }
    await signOut()
    showToast('You have signed out.')
  }

  return (
    <header
      className={[
        'navbar',
        useSolidNav ? 'navbar--scrolled' : '',
        useInverseNav ? 'navbar--inverse' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt={COMPANY.shortName} className="navbar__logo" loading="eager" decoding="sync" fetchPriority="high" />
          <span className="navbar__name">{COMPANY.shortName}</span>
        </Link>

        <nav className={`navbar__nav ${open ? 'navbar__nav--open' : ''}`}>
          {profile ? (
            <div className="navbar__mobile-session">
              <div className="navbar__session-user">
                <SessionAvatar
                  avatarUrl={profile.avatar_url}
                  name={profile.full_name}
                  email={profile.email}
                />
                <div className="navbar__session-text">
                  <span className="navbar__session-label">Signed in as</span>
                  <span className="navbar__session-name">{signedInName}</span>
                </div>
              </div>
              <Link to={dashboardPath} className="navbar__mobile-dash" onClick={() => setOpen(false)}>
                Go to Dashboard
              </Link>
              <div className="navbar__mobile-notifications">
                <NotificationBell />
              </div>
            </div>
          ) : null}
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
              <NotificationBell />
              <div className="navbar__session" title={`Signed in as ${signedInName}`}>
                <SessionAvatar
                  avatarUrl={profile.avatar_url}
                  name={profile.full_name}
                  email={profile.email}
                />
                <div className="navbar__session-text">
                  <span className="navbar__session-label">Signed in as</span>
                  <span className="navbar__session-name">{signedInName}</span>
                </div>
              </div>
              <Link to={dashboardPath} className="navbar__dash" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <button className="navbar__signout" type="button" onClick={() => void handleSignOut()}>
                Sign Out
              </button>
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
