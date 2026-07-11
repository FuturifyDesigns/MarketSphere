import { useRef, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { COMPANY } from '../lib/constants'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './AuthGate.css'

const base = import.meta.env.BASE_URL

export function AuthGate() {
  const pageRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useAuthPageEnter(pageRef)

  const gateStyle = {
    '--auth-cover': `url(${base}auth/auth-cover.png)`,
    '--auth-cover-signin': `url(${base}auth/sign-in.png)`,
    '--auth-cover-signup': `url(${base}auth/sign-up.png)`,
  } as CSSProperties

  return (
    <div className="auth-gate" ref={pageRef} style={gateStyle}>
      <div className="auth-gate__bg auth-gate__bg--base auth-theme-bg--base" aria-hidden="true" />
      <div className="auth-gate__bg auth-gate__bg--signin auth-theme-bg--signin" aria-hidden="true" />
      <div className="auth-gate__bg auth-gate__bg--signup auth-theme-bg--signup" aria-hidden="true" />

      <Link to="/" className="auth-gate__home">
        <img src={`${base}logo.png`} alt={COMPANY.shortName} />
        <span>{COMPANY.shortName}</span>
      </Link>

      <div className="auth-gate__card">
        <div className="auth-gate__card-cover" aria-hidden="true" />
        <div className="auth-gate__divider" aria-hidden="true" />

        <button
          type="button"
          className="auth-gate__half auth-gate__half--signin"
          aria-label="Sign in to your account"
          onClick={() => navigate('/login')}
        >
          <span className="auth-gate__half-overlay" aria-hidden="true" />
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

      <p className="auth-gate__footer">
        By continuing you agree to our terms of service and privacy policy.
      </p>
    </div>
  )
}
