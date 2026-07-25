import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AuthPageCover } from '../components/auth/AuthPageCover'
import { AuthMobileHeader } from '../components/auth/AuthMobileHeader'
import { Button } from '../components/ui/Button'
import { useAuthPageEnter } from '../hooks/useAuthPageEnter'
import { consumeOAuthSignupIntent } from '../lib/oauthIntent'
import { getBanMessage, isProfileBanned } from '../lib/accountGuard'
import type { Profile } from '../lib/types'
import './authTheme.css'
import './Auth.css'

type CallbackStatus = 'loading' | 'success' | 'error'

function readOAuthCode() {
  const fromSearch = new URLSearchParams(window.location.search).get('code')
  if (fromSearch) return fromSearch

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashPath = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  if (hashPath) {
    const fromHash = new URLSearchParams(hashPath).get('code')
    if (fromHash) return fromHash
  }
  return null
}

export function AuthCallback() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const navigate = useNavigate()
  const { refreshProfile, signOut } = useAuth()
  const { showToast } = useToast()
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [message, setMessage] = useState('Finishing Google sign-in…')

  useEffect(() => {
    let cancelled = false

    const finish = async () => {
      try {
        const code = readOAuthCode()
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (cancelled) return
          if (error) {
            setStatus('error')
            setMessage(error.message || 'Google sign-in failed.')
            return
          }
          // Clean sensitive query params from the address bar.
          window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}#/auth/callback`)
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return

        if (!session?.user) {
          setStatus('error')
          setMessage('Google sign-in did not complete. Please try again.')
          return
        }

        const intent = consumeOAuthSignupIntent()
        const fullName =
          (session.user.user_metadata?.full_name as string | undefined) ||
          (session.user.user_metadata?.name as string | undefined) ||
          ''

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (cancelled) return

        if (profileError || !profile) {
          await signOut()
          setStatus('error')
          setMessage('Could not load your account profile. Please try again.')
          return
        }

        if (isProfileBanned(profile as Profile)) {
          const banMessage = getBanMessage(profile as Profile)
          await signOut()
          setStatus('error')
          setMessage(banMessage)
          return
        }

        const updates: Record<string, unknown> = {}
        if ((!profile.full_name || !String(profile.full_name).trim()) && fullName.trim()) {
          updates.full_name = fullName.trim()
        }
        // Only elevate customer → provider from explicit signup intent; never touch admin.
        if (intent?.role === 'provider' && profile.role === 'customer') {
          updates.role = 'provider'
        }

        let nextRole = profile.role as string
        if (Object.keys(updates).length > 0) {
          const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id)
            .select('role')
            .maybeSingle()
          if (updateError) {
            console.error('[auth] oauth profile update failed', updateError)
          } else if (updated?.role) {
            nextRole = updated.role
          }
        }

        await refreshProfile()
        if (cancelled) return

        setStatus('success')
        setMessage('Signed in successfully.')
        showToast('Signed in with Google.')

        if (nextRole === 'admin') navigate('/dashboard/admin', { replace: true })
        else if (nextRole === 'provider') navigate('/dashboard/provider', { replace: true })
        else navigate('/dashboard/customer', { replace: true })
      } catch (error) {
        if (cancelled) return
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Google sign-in failed.')
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [navigate, refreshProfile, showToast, signOut])

  return (
    <div className="auth-page auth-page--signin" ref={pageRef}>
      <AuthPageCover variant="signin" />
      <div className="auth-shell auth-shell--centered">
        <AuthMobileHeader eyebrow="Google sign-in" backTo="/login" />
        <div className="auth-card auth-card--success">
          {status === 'loading' ? (
            <>
              <div className="auth-card__success-icon auth-card__success-icon--pulse" aria-hidden="true">
                …
              </div>
              <h2>Connecting your account</h2>
              <p className="auth-subtitle">{message}</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="auth-card__success-icon" aria-hidden="true">
                ✓
              </div>
              <h2>You&apos;re signed in</h2>
              <p className="auth-subtitle">Redirecting to your dashboard…</p>
            </>
          ) : (
            <>
              <div className="auth-card__success-icon auth-card__success-icon--error" aria-hidden="true">
                !
              </div>
              <h2>Google sign-in failed</h2>
              <p className="auth-subtitle">{message}</p>
              <Button to="/login" size="lg">
                Back to Sign In <ArrowRight size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
