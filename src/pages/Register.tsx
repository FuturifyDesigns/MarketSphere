import { useState, useRef, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, CheckCircle2, MapPinned, UsersRound } from 'lucide-react'
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
  sanitizePersonName,
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneLocal,
  formatPhoneWithCountry,
  type FieldErrors,
} from '../lib/validation'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { PhoneInput } from '../components/ui/PhoneInput'
import { PasswordStrengthBar } from '../components/ui/PasswordStrengthBar'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './Auth.css'

type RegisterFields = 'full_name' | 'email' | 'phone' | 'password'

export function Register() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const { signUp } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer'

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phoneCountry: '+267',
    phoneLocal: '',
    role: defaultRole,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterFields>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key in fieldErrors) {
      setFieldErrors((prev) => clearFieldError(prev, key as RegisterFields))
    }
  }

  const isProvider = form.role === 'provider'
  const roleLabel = isProvider ? 'Service Provider' : 'Customer'
  const roleSummary = isProvider
    ? 'You are applying to list your business and offer services on the marketplace.'
    : 'You are applying to browse providers, save favourites, and book services.'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const errors = collectErrors<RegisterFields>([
      ['full_name', validateName(form.full_name, 'Full name')],
      ['email', validateEmail(form.email)],
      ['phone', validatePhoneLocal(form.phoneLocal, true)],
      ['password', validatePassword(form.password)],
    ])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    if (!privacyConsent) {
      setError('Please accept the Privacy Policy and Terms of Service to continue.')
      showToast('Please accept the Privacy Policy and Terms of Service to continue.', 'error')
      return
    }

    const phone = formatPhoneWithCountry(form.phoneCountry, form.phoneLocal)

    setLoading(true)
    const { error: err } = await signUp(form.email.trim(), form.password, {
      full_name: form.full_name.trim(),
      phone: phone || undefined,
      role: form.role,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } else {
      showToast('Account created. Check your email to verify your address.', 'info')
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="auth-page auth-page--signup" ref={pageRef}>
        <AuthPageCover variant="signup" />
      <div className="auth-shell auth-shell--centered">
        <AuthMobileHeader eyebrow="Almost there" backTo="/get-started" />
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
        <AuthMobileHeader eyebrow="Join the network" backTo="/get-started" />
        <aside className="auth-shell__aside auth-shell__aside--register">
          <Link to="/" className="auth-shell__brand">
            <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt="" loading="eager" decoding="sync" fetchPriority="high" />
            <span>{COMPANY.shortName}</span>
          </Link>
          <div className="auth-shell__aside-content">
            <span className="auth-shell__eyebrow">Join the network</span>
            <h1>Build your presence on Botswana&apos;s service marketplace</h1>
            <p>Whether you need trusted services or want to list your business — {COMPANY.shortName} connects you.</p>
            <ul className="auth-shell__perks">
              <li><UsersRound size={20} strokeWidth={2} /> Customer or provider accounts</li>
              <li><BadgeCheck size={20} strokeWidth={2} /> Verified professional network</li>
              <li><MapPinned size={20} strokeWidth={2} /> Nationwide reach across Botswana</li>
            </ul>
          </div>
        </aside>

        <div className="auth-shell__form-wrap">
          <div className="auth-card auth-card--split auth-card--wide">
            <div className="auth-card__header">
              <h2>Create account</h2>
              <p className="auth-subtitle">Choose your side, then complete your application</p>
            </div>

            <p className="role-toggle__heading">How are you joining?</p>
            <div className="role-toggle" role="radiogroup" aria-label="Account type">
              <button
                type="button"
                className={form.role === 'customer' ? 'role-toggle__btn--active' : ''}
                aria-pressed={form.role === 'customer'}
                onClick={() => updateField('role', 'customer')}
              >
                <span className="role-toggle__title">I&apos;m a Customer</span>
                <span className="role-toggle__hint">Find and book services</span>
              </button>
              <button
                type="button"
                className={form.role === 'provider' ? 'role-toggle__btn--active' : ''}
                aria-pressed={form.role === 'provider'}
                onClick={() => updateField('role', 'provider')}
              >
                <span className="role-toggle__title">I&apos;m a Provider</span>
                <span className="role-toggle__hint">List your business</span>
              </button>
            </div>

            <div className="role-choice-banner" role="status" aria-live="polite">
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <p className="role-choice-banner__title">
                  Applying as a <strong>{roleLabel}</strong>
                </p>
                <p className="role-choice-banner__text">{roleSummary}</p>
              </div>
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
              <PhoneInput
                countryCode={form.phoneCountry}
                localNumber={form.phoneLocal}
                onCountryCodeChange={(phoneCountry) => updateField('phoneCountry', phoneCountry)}
                onLocalNumberChange={(phoneLocal) => updateField('phoneLocal', phoneLocal)}
                hint={FIELD_HINTS.phone}
                error={fieldErrors.phone}
              />
              <PasswordInput
                label="Password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                hint={FIELD_HINTS.password}
                error={fieldErrors.password}
              />
              {form.password ? (
                <div className="auth-form__strength">
                  <PasswordStrengthBar password={form.password} />
                </div>
              ) : null}
              <div className="auth-form__feedback" aria-live="polite">
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
              </div>
              <label className="auth-consent">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                />
                <span>
                  I agree to the <Link to="/terms">Terms of Service</Link> and{' '}
                  <Link to="/privacy">Privacy Policy</Link>, and consent to the processing of my
                  personal data in accordance with Botswana&apos;s Data Protection Act, 2024.
                </span>
              </label>
              <Button type="submit" size="lg" disabled={loading}>
                {loading
                  ? 'Submitting application...'
                  : isProvider
                    ? 'Apply as Provider'
                    : 'Apply as Customer'}{' '}
                <ArrowRight size={16} />
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
