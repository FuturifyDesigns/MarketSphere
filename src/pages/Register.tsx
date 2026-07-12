import { useState, useRef, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { COMPANY } from '../lib/constants'
import { AuthPageCover } from '../components/auth/AuthPageCover'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  sanitizePersonName,
  sanitizePhone,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
  type FieldErrors,
} from '../lib/validation'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordStrengthBar } from '../components/ui/PasswordStrengthBar'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './Auth.css'

type RegisterFields = 'full_name' | 'email' | 'phone' | 'password'

export function Register() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const { signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer'

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: defaultRole,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterFields>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key in fieldErrors) {
      setFieldErrors((prev) => clearFieldError(prev, key as RegisterFields))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const errors = collectErrors<RegisterFields>([
      ['full_name', validateName(form.full_name, 'Full name')],
      ['email', validateEmail(form.email)],
      ['phone', validatePhone(form.phone, true)],
      ['password', validatePassword(form.password)],
    ])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    setLoading(true)
    const { error: err } = await signUp(form.email.trim(), form.password, {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="auth-page auth-page--signup" ref={pageRef}>
        <AuthPageCover variant="signup" />
        <div className="auth-shell auth-shell--centered">
          <div className="auth-card auth-card--success">
            <div className="auth-card__success-icon" aria-hidden="true">✓</div>
            <h2>Check your email</h2>
            <p className="auth-subtitle">
              We&apos;ve sent a confirmation link to <strong>{form.email}</strong>.
              Please verify your email to complete registration.
            </p>
            <Button to="/login" size="lg">Go to Sign In <ArrowRight size={16} /></Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page auth-page--signup" ref={pageRef}>
      <AuthPageCover variant="signup" />
      <div className="auth-shell">
        <aside className="auth-shell__aside auth-shell__aside--register">
          <Link to="/" className="auth-shell__brand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
            <span>{COMPANY.shortName}</span>
          </Link>
          <div className="auth-shell__aside-content">
            <span className="auth-shell__eyebrow">Join the network</span>
            <h1>Build your presence on Botswana&apos;s service marketplace</h1>
            <p>Whether you need trusted services or want to list your business — {COMPANY.shortName} connects you.</p>
            <ul className="auth-shell__perks">
              <li><Sparkles size={16} /> Customer or provider accounts</li>
              <li><Sparkles size={16} /> Verified professional network</li>
              <li><Sparkles size={16} /> Nationwide reach across Botswana</li>
            </ul>
          </div>
        </aside>

        <div className="auth-shell__form-wrap">
          <div className="auth-card auth-card--split auth-card--wide">
            <div className="auth-card__header">
              <h2>Create account</h2>
              <p className="auth-subtitle">Join as a customer or service provider</p>
            </div>

            <div className="role-toggle">
              <button
                type="button"
                className={form.role === 'customer' ? 'role-toggle__btn--active' : ''}
                onClick={() => updateField('role', 'customer')}
              >
                I&apos;m a Customer
              </button>
              <button
                type="button"
                className={form.role === 'provider' ? 'role-toggle__btn--active' : ''}
                onClick={() => updateField('role', 'provider')}
              >
                I&apos;m a Provider
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <Input
                label="Full Name"
                autoComplete="name"
                value={form.full_name}
                onChange={(e) => updateField('full_name', sanitizePersonName(e.target.value))}
                hint={FIELD_HINTS.fullName}
                error={fieldErrors.full_name}
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                hint={FIELD_HINTS.email}
                error={fieldErrors.email}
              />
              <Input
                label="Phone (optional)"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', sanitizePhone(e.target.value))}
                hint={FIELD_HINTS.phone}
                error={fieldErrors.phone}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                hint={FIELD_HINTS.password}
                error={fieldErrors.password}
              />
              <div className="auth-form__strength">
                <PasswordStrengthBar password={form.password} />
              </div>
              <div className="auth-form__feedback" aria-live="polite">
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
              </div>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'} <ArrowRight size={16} />
              </Button>
            </form>

            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
              <span className="auth-footer__sep">·</span>
              <Link to="/get-started">Back to options</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
