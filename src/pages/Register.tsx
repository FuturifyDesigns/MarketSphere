import { useState, useRef, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
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

  if (success) {
    return (
      <div className="auth-page" ref={pageRef}>
        <div className="auth-card">
          <h1>Check your email</h1>
          <p className="auth-subtitle">
            We've sent a confirmation link to <strong>{form.email}</strong>.
            Please verify your email to complete registration.
          </p>
          <Button to="/login" size="lg">Go to Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page" ref={pageRef}>
      <div className="auth-card auth-card--wide">
        <Link to="/" className="auth-logo">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
        </Link>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Join {COMPANY.shortName} as a customer or service provider</p>

        <div className="role-toggle">
          <button
            type="button"
            className={form.role === 'customer' ? 'role-toggle__btn--active' : ''}
            onClick={() => setForm({ ...form, role: 'customer' })}
          >
            I'm a Customer
          </button>
          <button
            type="button"
            className={form.role === 'provider' ? 'role-toggle__btn--active' : ''}
            onClick={() => setForm({ ...form, role: 'provider' })}
          >
            I'm a Provider
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
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
