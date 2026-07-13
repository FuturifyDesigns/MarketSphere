import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { EmailOtpType } from '@supabase/supabase-js'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AuthPageCover } from '../components/auth/AuthPageCover'
import { AuthMobileHeader } from '../components/auth/AuthMobileHeader'
import { Button } from '../components/ui/Button'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import './authTheme.css'
import './Auth.css'

type VerifyStatus = 'loading' | 'success' | 'error'

export function VerifyEmail() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<VerifyStatus>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    const verify = async () => {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type') as EmailOtpType | null

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (cancelled) return
        if (error) {
          setStatus('error')
          setMessage(error.message)
          return
        }
        await supabase.auth.signOut()
        setStatus('success')
        return
      }

      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (error) {
          setStatus('error')
          setMessage(error.message)
          return
        }
        await supabase.auth.signOut()
        setStatus('success')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (session) {
        await supabase.auth.signOut()
        setStatus('success')
        return
      }

      setStatus('error')
      setMessage('This verification link is invalid or has expired. Please register again or request a new link.')
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  return (
    <div className="auth-page auth-page--signin" ref={pageRef}>
      <AuthPageCover variant="signin" />
      <div className="auth-shell auth-shell--centered">
        <AuthMobileHeader eyebrow="Email verification" backTo="/login" />
        <div className="auth-card auth-card--success">
          {status === 'loading' ? (
            <>
              <div className="auth-card__success-icon auth-card__success-icon--pulse" aria-hidden="true">…</div>
              <h2>Verifying your email</h2>
              <p className="auth-subtitle">Please wait while we confirm your account.</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="auth-card__success-icon" aria-hidden="true">✓</div>
              <h2>Verification successful</h2>
              <p className="auth-subtitle">
                Your email has been confirmed. You can now sign in to your Market Sphere Group account.
              </p>
              <Button to="/login" size="lg">
                Return to Sign In <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <div className="auth-card__success-icon auth-card__success-icon--error" aria-hidden="true">!</div>
              <h2>Verification failed</h2>
              <p className="auth-subtitle auth-error auth-error--inline">{message}</p>
              <Button to="/register" size="lg" variant="secondary">
                Back to Register <ArrowRight size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
