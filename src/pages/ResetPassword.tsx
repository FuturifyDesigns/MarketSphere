import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { EmailOtpType } from '@supabase/supabase-js'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { COMPANY, LOGO_PATH } from '../lib/constants'
import { AuthPageCover } from '../components/auth/AuthPageCover'
import { AuthMobileHeader } from '../components/auth/AuthMobileHeader'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  validatePassword,
  type FieldErrors,
} from '../lib/validation'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordStrengthBar } from '../components/ui/PasswordStrengthBar'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import { supabase } from '../lib/supabase'
import './authTheme.css'
import './Auth.css'

type ResetFields = 'password' | 'confirmPassword'

type ResetStatus = 'loading' | 'ready' | 'error' | 'success'

export function ResetPassword() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { updatePassword } = useAuth()
  const [status, setStatus] = useState<ResetStatus>('loading')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ResetFields>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const establishRecoverySession = async () => {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type') as EmailOtpType | null

      if (tokenHash && type === 'recovery') {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (cancelled) return
        if (verifyError) {
          setStatus('error')
          setMessage(verifyError.message)
          return
        }
        setStatus('ready')
        return
      }

      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (exchangeError) {
          setStatus('error')
          setMessage(exchangeError.message)
          return
        }
        setStatus('ready')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (session) {
        setStatus('ready')
        return
      }

      setStatus('error')
      setMessage('This reset link is invalid or has expired. Please request a new one.')
    }

    void establishRecoverySession()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const errors = collectErrors<ResetFields>([
      ['password', validatePassword(password)],
      [
        'confirmPassword',
        password !== confirmPassword ? 'Passwords do not match' : null,
      ],
    ])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    setLoading(true)
    const { error: err } = await updatePassword(password)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      await supabase.auth.signOut()
      setStatus('success')
      window.setTimeout(() => navigate('/login'), 2500)
    }
  }

  if (status === 'loading') {
    return (
      <div className="auth-page auth-page--signin" ref={pageRef}>
        <AuthPageCover variant="signin" />
        <div className="auth-shell auth-shell--centered">
          <AuthMobileHeader eyebrow="Reset password" backTo="/login" />
          <div className="auth-card auth-card--success">
            <div className="auth-card__success-icon auth-card__success-icon--pulse" aria-hidden="true">…</div>
            <h2>Preparing reset</h2>
            <p className="auth-subtitle">Please wait while we verify your reset link.</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="auth-page auth-page--signin" ref={pageRef}>
        <AuthPageCover variant="signin" />
        <div className="auth-shell auth-shell--centered">
          <AuthMobileHeader eyebrow="Reset password" backTo="/login" />
          <div className="auth-card auth-card--success">
            <div className="auth-card__success-icon auth-card__success-icon--error" aria-hidden="true">!</div>
            <h2>Reset link expired</h2>
            <p className="auth-subtitle auth-error auth-error--inline">{message}</p>
            <Button to="/forgot-password" size="lg">
              Request New Link <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="auth-page auth-page--signin" ref={pageRef}>
        <AuthPageCover variant="signin" />
        <div className="auth-shell auth-shell--centered">
          <AuthMobileHeader eyebrow="All set" backTo="/login" />
          <div className="auth-card auth-card--success">
            <div className="auth-card__success-icon" aria-hidden="true">✓</div>
            <h2>Password updated</h2>
            <p className="auth-subtitle">Your password has been changed. Redirecting you to sign in…</p>
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
        <AuthMobileHeader eyebrow="New password" backTo="/login" />
        <aside className="auth-shell__aside auth-shell__aside--login">
          <Link to="/" className="auth-shell__brand">
            <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt="" loading="eager" decoding="sync" fetchPriority="high" />
            <span>{COMPANY.shortName}</span>
          </Link>
          <div className="auth-shell__aside-content">
            <span className="auth-shell__eyebrow">Choose a new password</span>
            <h1>Secure your account</h1>
            <p>Pick a strong password you haven&apos;t used elsewhere.</p>
          </div>
        </aside>

        <div className="auth-shell__form-wrap">
          <div className="auth-card auth-card--split">
            <div className="auth-card__header">
              <h2>Set new password</h2>
              <p className="auth-subtitle">Enter and confirm your new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <Input
                label="New Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFieldErrors((prev) => clearFieldError(prev, 'password'))
                }}
                hint={FIELD_HINTS.password}
                error={fieldErrors.password}
              />
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setFieldErrors((prev) => clearFieldError(prev, 'confirmPassword'))
                }}
                error={fieldErrors.confirmPassword}
              />
              <div className="auth-form__strength">
                <PasswordStrengthBar password={password} />
              </div>
              <div className="auth-form__feedback" aria-live="polite">
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
              </div>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'} <ArrowRight size={16} />
              </Button>
            </form>

            <p className="auth-footer">
              <Link to="/login">Back to Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
