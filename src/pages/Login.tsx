import { useState, useRef, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import {
  applyRememberMePreference,
  getRememberedEmail,
  getRememberMe,
} from '../lib/authPersistence'
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
import { PasswordInput } from '../components/ui/PasswordInput'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import { useSubmitLock } from '../hooks/useSubmitLock'
import { clientRateLimitMessage, isClientRateLimited, markClientRateLimited } from '../lib/clientRateLimit'
import './authTheme.css'
import './Auth.css'

type LoginFields = 'email' | 'password'
const AUTH_RATE_LIMIT_MS = 5_000

export function Login() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const { signIn } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => getRememberedEmail())
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => getRememberMe())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginFields>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { locked, runLocked } = useSubmitLock()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading || locked) return
    setError('')

    const errors = collectErrors<LoginFields>([
      ['email', validateEmail(email)],
      ['password', password ? null : 'Password is required'],
    ])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    if (isClientRateLimited('auth-login', AUTH_RATE_LIMIT_MS)) {
      const msg = clientRateLimitMessage(AUTH_RATE_LIMIT_MS)
      setError(msg)
      showToast(msg, 'error')
      return
    }

    await runLocked(async () => {
      setLoading(true)
      markClientRateLimited('auth-login')
      try {
        // Must run before signIn so the session is written to the correct storage.
        applyRememberMePreference(rememberMe, email.trim())

        const { error: err, bannedReason } = await signIn(email.trim(), password)
        if (err) {
          setError(bannedReason || err.message)
          showToast(bannedReason || err.message, 'error')
          return
        }

        showToast(
          rememberMe
            ? 'Signed in successfully. We’ll keep you signed in on this device.'
            : 'Signed in successfully. You’ll stay signed in until you close this browser.',
        )
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
          if (data?.role === 'admin') navigate('/dashboard/admin')
          else if (data?.role === 'provider') navigate('/dashboard/provider')
          else navigate('/dashboard/customer')
        } else {
          navigate('/')
        }
      } catch {
        setError('Sign in failed. Please try again.')
        showToast('Sign in failed. Please try again.', 'error')
      } finally {
        setLoading(false)
      }
    })
  }

  return (
    <div className="auth-page auth-page--signin" ref={pageRef}>
      <AuthPageCover variant="signin" />
      <div className="auth-shell">
        <AuthMobileHeader eyebrow="Welcome back" backTo="/get-started" />
        <aside className="auth-shell__aside auth-shell__aside--login">
          <Link to="/" className="auth-shell__brand">
            <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt="" loading="eager" decoding="sync" fetchPriority="high" />
            <span>{COMPANY.shortName}</span>
          </Link>
          <div className="auth-shell__aside-content">
            <span className="auth-shell__eyebrow">Welcome back</span>
            <h1>Sign in and pick up where you left off</h1>
            <p>Access your dashboard, saved providers, and account settings in one place.</p>
            <ul className="auth-shell__perks">
              <li><ShieldCheck size={20} strokeWidth={2} /> Verified provider network</li>
              <li><Lock size={20} strokeWidth={2} /> Secure account access</li>
              <li><LayoutDashboard size={20} strokeWidth={2} /> Role-based dashboards</li>
            </ul>
          </div>
        </aside>

        <div className="auth-shell__form-wrap">
          <div className="auth-card auth-card--split">
            <div className="auth-card__header">
              <h2>Sign in</h2>
              <p className="auth-subtitle">Enter your credentials to continue</p>
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
              <PasswordInput
                label="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFieldErrors((prev) => clearFieldError(prev, 'password'))
                }}
                hint={FIELD_HINTS.password}
                error={fieldErrors.password}
              />
              <div className="auth-form__row">
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <p className="auth-form__forgot">
                  <Link to="/forgot-password">Forgot password?</Link>
                </p>
              </div>
              <p className="auth-remember__hint">
                {rememberMe
                  ? 'Stay signed in on this device after you close the browser.'
                  : 'You’ll be signed out when this browser session ends.'}
              </p>
              <div className="auth-form__feedback" aria-live="polite">
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
              </div>
              <Button type="submit" size="lg" disabled={loading || locked}>
                {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
              </Button>
            </form>

            <p className="auth-footer">
              Don&apos;t have an account? <Link to="/register">Create one</Link>
              <span className="auth-footer__sep">·</span>
              <Link to="/get-started">Back to options</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
