import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, UserPlus, ArrowRight } from 'lucide-react'
import { COMPANY } from '../lib/constants'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './AuthGate.css'

export function AuthGate() {
  const pageRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useAuthPageEnter(pageRef)

  return (
    <div className="auth-gate" ref={pageRef}>
      <div className="auth-gate__bg" aria-hidden="true" />

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
          <span className="auth-gate__half-bg" aria-hidden="true" />
          <span className="auth-gate__half-shine" aria-hidden="true" />
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
          <span className="auth-gate__half-bg" aria-hidden="true" />
          <span className="auth-gate__half-shine" aria-hidden="true" />
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
