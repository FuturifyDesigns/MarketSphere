import { useEffect, useRef, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, UserPlus, ArrowRight } from 'lucide-react'
import { COMPANY, LOGO_PATH } from '../lib/constants'
import { preloadAuthCovers } from '../lib/imagePreload'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './AuthGate.css'

const base = import.meta.env.BASE_URL

export function AuthGate() {
  const pageRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useAuthPageEnter(pageRef)

  useEffect(() => {
    preloadAuthCovers()
  }, [])

  const gateStyle = {
    '--auth-cover-signin': `url(${base}auth/sign-in.webp)`,
    '--auth-cover-signup': `url(${base}auth/sign-up.webp)`,
  } as CSSProperties

  return (
    <div className="auth-gate" ref={pageRef} style={gateStyle}>
      <div className="auth-gate__bg auth-gate__bg--base" aria-hidden="true" />
      <div className="auth-gate__bg auth-gate__bg--signin auth-theme-bg--signin" aria-hidden="true" />
      <div className="auth-gate__bg auth-gate__bg--signup auth-theme-bg--signup" aria-hidden="true" />

      <div className="auth-gate__stack">
        <Link to="/" className="auth-gate__brand">
          <img src={`${base}${LOGO_PATH}`} alt="" loading="eager" decoding="sync" fetchPriority="high" />
          <span>{COMPANY.shortName}</span>
        </Link>

        <div className="auth-gate__card">
        <div className="auth-gate__divider" aria-hidden="true" />

        <button
          type="button"
          className="auth-gate__half auth-gate__half--signin"
          aria-label="Sign in to your account"
          onClick={() => navigate('/login')}
        >
          <span className="auth-gate__half-overlay" aria-hidden="true" />
          <div className="auth-gate__panel auth-gate__panel--default">
            <LogIn className="auth-gate__icon auth-gate__icon--signin" size={32} strokeWidth={1.5} />
            <span className="auth-gate__label auth-gate__label--signin">Sign In</span>
          </div>
          <div className="auth-gate__panel auth-gate__panel--hover">
            <span className="auth-gate__eyebrow">Welcome back</span>
            <h2>Sign in to your account</h2>
            <p>Access your dashboard and connect with verified providers across Botswana.</p>
            <span className="auth-gate__cta">
              Continue to sign in <ArrowRight size={14} />
            </span>
          </div>
        </button>

        <button
          type="button"
          className="auth-gate__half auth-gate__half--signup"
          aria-label="Create your account"
          onClick={() => navigate('/register')}
        >
          <span className="auth-gate__half-overlay" aria-hidden="true" />
          <div className="auth-gate__panel auth-gate__panel--default">
            <UserPlus className="auth-gate__icon auth-gate__icon--signup" size={40} strokeWidth={1.5} />
            <span className="auth-gate__label auth-gate__label--signup">Sign Up</span>
          </div>
          <div className="auth-gate__panel auth-gate__panel--hover">
            <span className="auth-gate__eyebrow">Join us</span>
            <h2>Create your account</h2>
            <p>Register as a customer or list your business with {COMPANY.shortName}.</p>
            <span className="auth-gate__cta">
              Continue to sign up <ArrowRight size={14} />
            </span>
          </div>
        </button>
        </div>
      </div>

      <p className="auth-gate__footer">
        By continuing you agree to our terms of service and privacy policy.
      </p>
    </div>
  )
}
