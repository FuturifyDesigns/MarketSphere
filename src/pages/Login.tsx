import { useState, useRef, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { COMPANY, LOGO_PATH } from '../lib/constants'
import { AuthPageCover } from '../components/auth/AuthPageCover'
import { AuthMobileHeader } from '../components/auth/AuthMobileHeader'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  validateEmail,
  validatePassword,
  type FieldErrors,
} from '../lib/validation'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './Auth.css'

type LoginFields = 'email' | 'password'

export function Login() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const { signIn } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginFields>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const errors = collectErrors<LoginFields>([
      ['email', validateEmail(email)],
      ['password', validatePassword(password)],
    ])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    setLoading(true)
    const { error: err, bannedReason } = await signIn(email.trim(), password)
    setLoading(false)
    if (err) {
      setError(bannedReason || err.message)
      showToast(bannedReason || err.message, 'error')
    } else {
      showToast('Signed in successfully. Welcome back!')
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (data?.role === 'admin') navigate('/dashboard/admin')
        else if (data?.role === 'provider') navigate('/dashboard/provider')
        else navigate('/dashboard/customer')
      } else {
        navigate('/')
      }
    }
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
              <p className="auth-form__forgot">
                <Link to="/forgot-password">Forgot password?</Link>
              </p>
              <div className="auth-form__feedback" aria-live="polite">
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
              </div>
              <Button type="submit" size="lg" disabled={loading}>
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
