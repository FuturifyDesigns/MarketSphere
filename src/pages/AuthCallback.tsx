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
import {
  clearOAuthSignupIntent,
  consumeOAuthSignupIntent,
  isOAuthCancelError,
  peekOAuthReturnTo,
} from '../lib/oauthIntent'
import { getBanMessage, isProfileBanned } from '../lib/accountGuard'
import type { Profile } from '../lib/types'
import './authTheme.css'
import './Auth.css'

type CallbackStatus = 'loading' | 'success' | 'error'

function readOAuthParams() {
  const fromSearch = new URLSearchParams(window.location.search)
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const fromHash = new URLSearchParams(hashQuery)

  return {
    code: fromSearch.get('code') || fromHash.get('code'),
    errorDescription:
      fromSearch.get('error_description') ||
      fromHash.get('error_description') ||
      fromSearch.get('error') ||
      fromHash.get('error'),
  }
}

function clearOAuthParamsFromUrl() {
  window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}#/auth/callback`)
}

async function waitForProfile(userId: string, attempts = 8): Promise<Profile | null> {
  for (let i = 0; i < attempts; i += 1) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (!error && data) return data as Profile
    await new Promise((resolve) => window.setTimeout(resolve, 250))
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

    const returnHome = (path: '/login' | '/register', toastMessage: string) => {
      clearOAuthSignupIntent()
      clearOAuthParamsFromUrl()
      showToast(toastMessage, 'info')
      navigate(path, { replace: true })
    }

    const finish = async () => {
      try {
        const { code, errorDescription } = readOAuthParams()
        const returnTo = peekOAuthReturnTo() === 'register' ? '/register' : '/login'

        if (errorDescription) {
          const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          if (isOAuthCancelError(decoded) || isOAuthCancelError(errorDescription)) {
            returnHome(returnTo, 'Google sign-in cancelled. You can continue with email.')
            return
          }
          clearOAuthSignupIntent()
          clearOAuthParamsFromUrl()
          setStatus('error')
          setMessage(decoded)
          return
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (cancelled) return
          if (error) {
            const {
              data: { session: existing },
            } = await supabase.auth.getSession()
            if (!existing) {
              if (isOAuthCancelError(error.message)) {
                returnHome(returnTo, 'Google sign-in cancelled. You can continue with email.')
                return
              }
              clearOAuthSignupIntent()
              setStatus('error')
              setMessage(error.message || 'Google sign-in failed.')
              return
            }
          }
          clearOAuthParamsFromUrl()
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return

        if (!session?.user) {
          // No code and no session usually means cancel / incomplete redirect.
          returnHome(returnTo, 'Google sign-in cancelled. You can continue with email.')
          return
        }

        const intent = consumeOAuthSignupIntent()
        const createdAtMs = Date.parse(session.user.created_at || '')
        const isNewAccount = Number.isFinite(createdAtMs) && Date.now() - createdAtMs < 10 * 60 * 1000

        const fullName =
          (session.user.user_metadata?.full_name as string | undefined) ||
          (session.user.user_metadata?.name as string | undefined) ||
          ''

        const profile = await waitForProfile(session.user.id)
        if (cancelled) return

        if (!profile) {
          await signOut()
          setStatus('error')
          setMessage('Could not load your account profile. Please try again.')
          return
        }

        if (isProfileBanned(profile)) {
          const banMessage = getBanMessage(profile)
          await signOut()
          setStatus('error')
          setMessage(banMessage)
          return
        }

        const updates: Record<string, unknown> = {}
        if ((!profile.full_name || !String(profile.full_name).trim()) && fullName.trim()) {
          updates.full_name = fullName.trim()
        }
        if (isNewAccount && intent?.role === 'provider' && profile.role === 'customer') {
          updates.role = 'provider'
        }

        let nextRole = profile.role
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
            nextRole = updated.role as Profile['role']
          }
        }

        await refreshProfile()
        if (cancelled) return

        setStatus('success')
        setMessage(isNewAccount ? 'Account created. Signing you in…' : 'Welcome back. Signing you in…')
        showToast(isNewAccount ? 'Account created with Google.' : 'Signed in with Google.')

        if (nextRole === 'admin') navigate('/dashboard/admin', { replace: true })
        else if (nextRole === 'provider') navigate('/dashboard/provider', { replace: true })
        else navigate('/dashboard/customer', { replace: true })
      } catch (error) {
        if (cancelled) return
        clearOAuthSignupIntent()
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
              <p className="auth-subtitle">{message}</p>
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
