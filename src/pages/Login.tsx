import { useState, useRef, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './Auth.css'

export function Login() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
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
      <div className="auth-page__bg auth-theme-bg--signin" aria-hidden="true" />
      <div className="auth-shell">
        <aside className="auth-shell__aside auth-shell__aside--login">
          <Link to="/" className="auth-shell__brand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
            <span>{COMPANY.shortName}</span>
          </Link>
          <div className="auth-shell__aside-content">
            <span className="auth-shell__eyebrow">Welcome back</span>
            <h1>Sign in and pick up where you left off</h1>
            <p>Access your dashboard, saved providers, and account settings in one place.</p>
            <ul className="auth-shell__perks">
              <li><ShieldCheck size={16} /> Verified provider network</li>
              <li><ShieldCheck size={16} /> Secure account access</li>
              <li><ShieldCheck size={16} /> Role-based dashboards</li>
            </ul>
          </div>
        </aside>

        <div className="auth-shell__form-wrap">
          <div className="auth-card auth-card--split">
            <div className="auth-card__header">
              <h2>Sign in</h2>
              <p className="auth-subtitle">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <p className="auth-error">{error}</p>}
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
