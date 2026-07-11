import { useRef, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, UserPlus, ArrowRight } from 'lucide-react'
import { COMPANY } from '../lib/constants'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './AuthGate.css'

export function AuthGate() {
  const pageRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useAuthPageEnter(pageRef)

  const gateStyle = {
    '--auth-cover-signin': `url(${import.meta.env.BASE_URL}auth/sign-in.png)`,
    '--auth-cover-signup': `url(${import.meta.env.BASE_URL}auth/sign-up.png)`,
  } as CSSProperties

  return (
    <div className="auth-gate" ref={pageRef} style={gateStyle}>
      <div className="auth-gate__bg auth-gate__bg--base auth-theme-bg--base" aria-hidden="true" />
      <div className="auth-gate__bg auth-gate__bg--signin auth-theme-bg--signin" aria-hidden="true" />
      <div className="auth-gate__bg auth-gate__bg--signup auth-theme-bg--signup" aria-hidden="true" />

      <Link to="/" className="auth-gate__home">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt={COMPANY.shortName} />
        <span>{COMPANY.shortName}</span>
      </Link>

      <div className="auth-gate__card">
        <div className="auth-gate__divider" aria-hidden="true" />

        <button
          type="button"
          className="auth-gate__half auth-gate__half--signin"
          onClick={() => navigate('/login')}
        >
          <span className="auth-gate__half-cover auth-gate__half-cover--signin" aria-hidden="true" />
          <span className="auth-gate__half-overlay" aria-hidden="true" />
          <div className="auth-gate__panel auth-gate__panel--default">
            <LogIn size={28} strokeWidth={1.5} />
            <span className="auth-gate__label">Sign In</span>
          </div>
          <div className="auth-gate__panel auth-gate__panel--hover">
            <span className="auth-gate__eyebrow">Welcome back</span>
            <h2>Sign in to your account</h2>
            <p>Access your dashboard, manage bookings, and connect with verified providers across Botswana.</p>
            <span className="auth-gate__cta">
              Continue to sign in <ArrowRight size={14} />
            </span>
          </div>
        </button>

        <button
          type="button"
          className="auth-gate__half auth-gate__half--signup"
          onClick={() => navigate('/register')}
        >
          <span className="auth-gate__half-cover auth-gate__half-cover--signup" aria-hidden="true" />
          <span className="auth-gate__half-overlay" aria-hidden="true" />
          <div className="auth-gate__panel auth-gate__panel--default">
            <UserPlus size={28} strokeWidth={1.5} />
            <span className="auth-gate__label">Sign Up</span>
          </div>
          <div className="auth-gate__panel auth-gate__panel--hover">
            <span className="auth-gate__eyebrow">Join us</span>
            <h2>Create your account</h2>
            <p>Register as a customer to find services, or list your business and grow with {COMPANY.shortName}.</p>
            <span className="auth-gate__cta">
              Continue to sign up <ArrowRight size={14} />
            </span>
          </div>
        </button>
      </div>

      <p className="auth-gate__footer">
        By continuing you agree to our terms of service and privacy policy.
      </p>
    </div>
  )
}
