import { useState, useRef, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, CheckCircle2, MapPinned, UsersRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { COMPANY, LOGO_PATH } from '../lib/constants'
import { AuthPageCover } from '../components/auth/AuthPageCover'
import { AuthMobileHeader } from '../components/auth/AuthMobileHeader'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  sanitizePersonName,
  validateConfirmPassword,
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
import { useSubmitLock } from '../hooks/useSubmitLock'
import { useResetGoogleLoading } from '../hooks/useResetGoogleLoading'
import { clientRateLimitMessage, isClientRateLimited, markClientRateLimited } from '../lib/clientRateLimit'
import { storeOAuthSignupIntent } from '../lib/oauthIntent'
import './authTheme.css'
import './Auth.css'

type RegisterFields = 'full_name' | 'email' | 'phone' | 'password' | 'confirmPassword'
const AUTH_RATE_LIMIT_MS = 8_000

export function Register() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const { signUp, signInWithGoogle } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer'

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneCountry: '+267',
    phoneLocal: '',
    role: defaultRole,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterFields>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [roleSelected, setRoleSelected] = useState(() => searchParams.get('role') === 'provider' || searchParams.get('role') === 'customer')
  const [roleError, setRoleError] = useState('')
  const { locked, runLocked } = useSubmitLock()
  useResetGoogleLoading(setGoogleLoading)

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'role') {
      setRoleSelected(true)
      setRoleError('')
    }
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
    if (loading || locked || googleLoading) return
    setError('')
    setConsentError('')
    setRoleError('')

    if (!roleSelected) {
      const msg = 'Choose Customer or Provider before creating your account.'
      setRoleError(msg)
      setError(msg)
      showToast(msg, 'error')
      return
    }
    const errors = collectErrors<RegisterFields>([
      ['full_name', validateName(form.full_name, 'Full name')],
      ['email', validateEmail(form.email)],
      ['phone', validatePhoneLocal(form.phoneLocal, true)],
      ['password', validatePassword(form.password)],
      ['confirmPassword', validateConfirmPassword(form.password, form.confirmPassword)],
    ])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    if (!privacyConsent) {
      const msg = 'Please accept the Terms of Service and Privacy Policy to continue.'
      setConsentError(msg)
      setError(msg)
      showToast(msg, 'error')
      return
    }

    if (isClientRateLimited('auth-register', AUTH_RATE_LIMIT_MS)) {
      const msg = clientRateLimitMessage(AUTH_RATE_LIMIT_MS)
      setError(msg)
      showToast(msg, 'error')
      return
    }

    const phone = formatPhoneWithCountry(form.phoneCountry, form.phoneLocal)

    await runLocked(async () => {
      setLoading(true)
      markClientRateLimited('auth-register')
      try {
        const { error: err } = await signUp(form.email.trim(), form.password, {
          full_name: form.full_name.trim(),
          phone: phone || undefined,
          role: form.role === 'provider' ? 'provider' : 'customer',
          privacy_consent: true,
          privacy_consent_at: new Date().toISOString(),
        })
        if (err) {
          setError(err.message)
          showToast(err.message, 'error')
        } else {
          showToast('Account created. Check your email to verify your address.', 'info')
          setSuccess(true)
        }
      } catch {
        setError('Sign up failed. Please try again.')
        showToast('Sign up failed. Please try again.', 'error')
      } finally {
        setLoading(false)
      }
    })
  }

  const handleGoogle = async () => {
    if (loading || locked || googleLoading) return
    setError('')
    setConsentError('')
    setRoleError('')

    if (!roleSelected) {
      const msg = 'Choose Customer or Provider before continuing with Google.'
      setRoleError(msg)
      setError(msg)
      showToast(msg, 'error')
      return
    }

    if (!privacyConsent) {
      const msg = 'Please accept the Terms of Service and Privacy Policy to continue with Google.'
      setConsentError(msg)
      setError(msg)
      showToast(msg, 'error')
      return
    }

    setGoogleLoading(true)
    const intendedRole = form.role === 'provider' ? 'provider' : 'customer'
    storeOAuthSignupIntent(intendedRole, true, 'register')
    try {
      const { error: err } = await signInWithGoogle(intendedRole)
      if (err) {
        setError(err.message)
        showToast(err.message, 'error')
        setGoogleLoading(false)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Google sign-in failed. Please try again.'
      setError(msg)
      showToast(msg, 'error')
      setGoogleLoading(false)
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
                className={roleSelected && form.role === 'customer' ? 'role-toggle__btn--active' : ''}
                aria-pressed={roleSelected && form.role === 'customer'}
                onClick={() => updateField('role', 'customer')}
              >
                <span className="role-toggle__title">I&apos;m a Customer</span>
                <span className="role-toggle__hint">Find and book services</span>
              </button>
              <button
                type="button"
                className={roleSelected && form.role === 'provider' ? 'role-toggle__btn--active' : ''}
                aria-pressed={roleSelected && form.role === 'provider'}
                onClick={() => updateField('role', 'provider')}
              >
                <span className="role-toggle__title">I&apos;m a Provider</span>
                <span className="role-toggle__hint">List your business</span>
              </button>
            </div>
            {roleError ? <p className="auth-error auth-error--inline" role="alert">{roleError}</p> : null}

            {roleSelected ? (
              <div className="role-choice-banner" role="status" aria-live="polite">
                <CheckCircle2 size={18} aria-hidden="true" />
                <div>
                  <p className="role-choice-banner__title">
                    Applying as a <strong>{roleLabel}</strong>
                  </p>
                  <p className="role-choice-banner__text">{roleSummary}</p>
                </div>
              </div>
            ) : (
              <p className="auth-google-hint">Select Customer or Provider first — required for Google and email signup.</p>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <GoogleAuthButton
                label="Continue with Google"
                loading={googleLoading}
                disabled={loading || locked || !roleSelected}
                onClick={() => void handleGoogle()}
              />
              <p className="auth-google-hint">
                New here? We&apos;ll create your account with the role above. Already registered? You&apos;ll be signed in.
              </p>
              <div className="auth-divider" role="separator" aria-label="or">
                <span>or</span>
              </div>
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
              <PasswordInput
                label="Confirm password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                hint={FIELD_HINTS.confirmPassword}
                error={fieldErrors.confirmPassword}
              />
              <div className="auth-form__feedback" aria-live="polite">
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
              </div>
              <div className={`auth-consent${consentError ? ' auth-consent--error' : ''}`}>
                <input
                  id="register-privacy-consent"
                  type="checkbox"
                  checked={privacyConsent}
                  aria-invalid={Boolean(consentError)}
                  aria-describedby={consentError ? 'register-privacy-consent-error' : undefined}
                  onChange={(e) => {
                    setPrivacyConsent(e.target.checked)
                    if (e.target.checked) {
                      setConsentError('')
                      setError('')
                    }
                  }}
                />
                <label htmlFor="register-privacy-consent">
                  I agree to the{' '}
                  <Link to="/terms" onClick={(e) => e.stopPropagation()}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" onClick={(e) => e.stopPropagation()}>
                    Privacy Policy
                  </Link>
                  , and consent to the processing of my personal data in accordance with Botswana&apos;s
                  Data Protection Act, 2024.
                </label>
              </div>
              {consentError ? (
                <p id="register-privacy-consent-error" className="auth-consent__error" role="alert">
                  {consentError}
                </p>
              ) : null}
              <Button type="submit" size="lg" disabled={loading || locked || googleLoading || !privacyConsent}>
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
