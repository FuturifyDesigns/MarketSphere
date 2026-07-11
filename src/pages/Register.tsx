import { useState, useRef, type CSSProperties, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './Auth.css'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signUp(form.email, form.password, {
      full_name: form.full_name,
      role: form.role,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
    }
  }

  const coverStyle = {
    '--auth-cover': `url(${import.meta.env.BASE_URL}auth/sign-up.png)`,
  } as CSSProperties

  if (success) {
    return (
      <div className="auth-page auth-page--signup" ref={pageRef}>
        <div
          className="auth-page__bg auth-page__bg--cover auth-theme-bg--signup"
          style={coverStyle}
          aria-hidden="true"
        />
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
      <div
        className="auth-page__bg auth-page__bg--cover auth-theme-bg--signup"
        style={coverStyle}
        aria-hidden="true"
      />
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
                onClick={() => setForm({ ...form, role: 'customer' })}
              >
                I&apos;m a Customer
              </button>
              <button
                type="button"
                className={form.role === 'provider' ? 'role-toggle__btn--active' : ''}
                onClick={() => setForm({ ...form, role: 'provider' })}
              >
                I&apos;m a Provider
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <Input
                label="Full Name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
              {error && <p className="auth-error">{error}</p>}
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
