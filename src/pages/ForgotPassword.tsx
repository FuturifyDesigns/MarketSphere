import { useState, useRef, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { COMPANY, LOGO_PATH } from '../lib/constants'
import { AuthPageCover } from '../components/auth/AuthPageCover'
import { AuthMobileHeader } from '../components/auth/AuthMobileHeader'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  validateEmail,
  type FieldErrors,
} from '../lib/validation'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './Auth.css'

type ForgotFields = 'email'

export function ForgotPassword() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const { resetPasswordForEmail } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ForgotFields>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const errors = collectErrors<ForgotFields>([['email', validateEmail(email)]])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    setLoading(true)
    const { error: err } = await resetPasswordForEmail(email.trim())
    setLoading(false)
    if (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } else {
      showToast('Password reset email sent. Check your inbox.', 'info')
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="auth-page auth-page--signin" ref={pageRef}>
        <AuthPageCover variant="signin" />
        <div className="auth-shell auth-shell--centered">
          <AuthMobileHeader eyebrow="Check your inbox" backTo="/login" />
          <div className="auth-card auth-card--success">
            <div className="auth-card__success-icon" aria-hidden="true">✓</div>
            <h2>Reset link sent</h2>
            <p className="auth-subtitle">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
              Check your inbox and spam folder.
            </p>
            <Button to="/login" size="lg">
              Return to Sign In <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page auth-page--signin" ref={pageRef}>
      <AuthPageCover variant="signin" />
      <div className="auth-shell">
        <AuthMobileHeader eyebrow="Reset password" backTo="/login" />
        <aside className="auth-shell__aside auth-shell__aside--login">
          <Link to="/" className="auth-shell__brand">
            <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt="" loading="eager" decoding="sync" fetchPriority="high" />
            <span>{COMPANY.shortName}</span>
          </Link>
          <div className="auth-shell__aside-content">
            <span className="auth-shell__eyebrow">Forgot password</span>
            <h1>We&apos;ll help you get back in</h1>
            <p>Enter the email linked to your account and we&apos;ll send you a secure reset link.</p>
            <ul className="auth-shell__perks">
              <li><Mail size={16} /> Secure one-time reset link</li>
              <li><Mail size={16} /> Link expires after a short time</li>
              <li><Mail size={16} /> Check spam if you don&apos;t see it</li>
            </ul>
          </div>
        </aside>

        <div className="auth-shell__form-wrap">
          <div className="auth-card auth-card--split">
            <div className="auth-card__header">
              <h2>Reset password</h2>
              <p className="auth-subtitle">We&apos;ll email you a link to choose a new password</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setFieldErrors((prev) => clearFieldError(prev, 'email'))
                }}
                hint={FIELD_HINTS.email}
                error={fieldErrors.email}
              />
              <div className="auth-form__feedback" aria-live="polite">
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
              </div>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={16} />
              </Button>
            </form>

            <p className="auth-footer">
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
