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
  ACCOUNT_EXISTS_SIGN_IN_MESSAGE,
  clearOAuthSignupIntent,
  isBrandNewAuthUser,
  isOAuthCancelError,
  peekOAuthReturnTo,
  peekOAuthSignupIntent,
  readIntentFromCallbackUrl,
  readRoleFromCallbackUrl,
  type OAuthIntendedRole,
} from '../lib/oauthIntent'
import { getBanMessage, isProfileBanned } from '../lib/accountGuard'
import type { Profile } from '../lib/types'
import './authTheme.css'
import './Auth.css'

type CallbackStatus = 'loading' | 'success' | 'error'

type OAuthFinishResult = {
  status: CallbackStatus
  message: string
  toast?: { text: string; type: 'info' | 'error' }
  navigateTo?: string
}

/** One shared run across React Strict Mode remounts. */
let oauthFinishShared: Promise<OAuthFinishResult> | null = null

function readOAuthParams() {
  const fromSearch = new URLSearchParams(window.location.search)
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : hash
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
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  window.history.replaceState({}, document.title, `${window.location.origin}${base}/auth/callback`)
}

async function waitForProfile(userId: string, attempts = 12): Promise<Profile | null> {
  for (let i = 0; i < attempts; i += 1) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (!error && data) return data as Profile
    await new Promise((resolve) => window.setTimeout(resolve, 250))
  }
  return null
}

async function claimProviderRoleWithRetry(attempts = 4): Promise<{ role: string | null; error: Error | null }> {
  let lastError: Error | null = null
  for (let i = 0; i < attempts; i += 1) {
    const { data, error } = await supabase.rpc('claim_provider_role')
    if (!error && data) return { role: String(data), error: null }
    lastError = error ? new Error(error.message) : new Error('claim_provider_role returned empty')
    await new Promise((resolve) => window.setTimeout(resolve, 300))
  }
  return { role: null, error: lastError }
}

function resolveIntendedRole(
  roleFromUrl: OAuthIntendedRole | null,
  intentFromUrl: 'login' | 'register' | null,
): { fromRegister: boolean; intendedRole: OAuthIntendedRole | null } {
  const intent = peekOAuthSignupIntent()
  const fromRegister =
    intent?.returnTo === 'register' ||
    intentFromUrl === 'register' ||
    Boolean(roleFromUrl) ||
    Boolean(intent?.role)
  const intendedRole = fromRegister ? (intent?.role ?? roleFromUrl) : null
  return { fromRegister, intendedRole }
}

async function finishOAuthCallback(signOut: () => Promise<void>, refreshProfile: () => Promise<void>): Promise<OAuthFinishResult> {
  try {
    const { code, errorDescription } = readOAuthParams()
    const returnTo = peekOAuthReturnTo() === 'register' ? '/register' : '/login'
    const roleFromUrl = readRoleFromCallbackUrl()
    const intentFromUrl = readIntentFromCallbackUrl()
    const { fromRegister, intendedRole } = resolveIntendedRole(roleFromUrl, intentFromUrl)

    if (errorDescription) {
      const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
      if (isOAuthCancelError(decoded) || isOAuthCancelError(errorDescription)) {
        clearOAuthSignupIntent()
        clearOAuthParamsFromUrl()
        return {
          status: 'loading',
          message: '',
          toast: { text: 'Google sign-in cancelled. You can continue with email.', type: 'info' },
          navigateTo: returnTo,
        }
      }
      clearOAuthSignupIntent()
      clearOAuthParamsFromUrl()
      return { status: 'error', message: decoded }
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        const {
          data: { session: existing },
        } = await supabase.auth.getSession()
        if (!existing) {
          if (isOAuthCancelError(error.message)) {
            clearOAuthSignupIntent()
            clearOAuthParamsFromUrl()
            return {
              status: 'loading',
              message: '',
              toast: { text: 'Google sign-in cancelled. You can continue with email.', type: 'info' },
              navigateTo: returnTo,
            }
          }
          clearOAuthSignupIntent()
          return { status: 'error', message: error.message || 'Google sign-in failed.' }
        }
      }
      clearOAuthParamsFromUrl()
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      clearOAuthSignupIntent()
      clearOAuthParamsFromUrl()
      return {
        status: 'loading',
        message: '',
        toast: { text: 'Google sign-in cancelled. You can continue with email.', type: 'info' },
        navigateTo: returnTo,
      }
    }

    const again = resolveIntendedRole(roleFromUrl, intentFromUrl)
    const effectiveFromRegister = fromRegister || again.fromRegister
    const effectiveRole = intendedRole ?? again.intendedRole
    const isNewAccount = isBrandNewAuthUser(session.user.created_at)

    if (!effectiveFromRegister && isNewAccount) {
      await signOut()
      clearOAuthSignupIntent()
      clearOAuthParamsFromUrl()
      return {
        status: 'loading',
        message: '',
        toast: {
          text: 'No account found for this Google login. Please sign up first and choose Customer or Provider.',
          type: 'info',
        },
        navigateTo: '/register',
      }
    }

    if (effectiveFromRegister && !isNewAccount) {
      await signOut()
      clearOAuthSignupIntent()
      clearOAuthParamsFromUrl()
      return {
        status: 'loading',
        message: '',
        toast: { text: ACCOUNT_EXISTS_SIGN_IN_MESSAGE, type: 'info' },
        navigateTo: '/login',
      }
    }

    const fullName =
      (session.user.user_metadata?.full_name as string | undefined) ||
      (session.user.user_metadata?.name as string | undefined) ||
      ''

    const profile = await waitForProfile(session.user.id)
    if (!profile) {
      await signOut()
      clearOAuthSignupIntent()
      return { status: 'error', message: 'Could not load your account profile. Please try again.' }
    }

    if (isProfileBanned(profile)) {
      const banMessage = getBanMessage(profile)
      await signOut()
      clearOAuthSignupIntent()
      return { status: 'error', message: banMessage }
    }

    if ((!profile.full_name || !String(profile.full_name).trim()) && fullName.trim()) {
      const { error: nameError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', session.user.id)
      if (nameError) console.error('[auth] oauth name update failed', nameError)
    }

    let nextRole = profile.role
    let claimFailed = false
    if (effectiveRole === 'provider' && profile.role === 'customer') {
      const { role: claimed, error: claimError } = await claimProviderRoleWithRetry()
      if (claimError || claimed !== 'provider') {
        console.error('[auth] claim_provider_role failed', claimError, { effectiveRole, claimed })
        claimFailed = true
      } else {
        nextRole = 'provider'
      }
    }

    clearOAuthSignupIntent()
    await refreshProfile()

    const destination =
      nextRole === 'admin'
        ? '/dashboard/admin'
        : nextRole === 'provider'
          ? '/dashboard/provider'
          : '/dashboard/customer'

    return {
      status: 'success',
      message: isNewAccount ? 'Account created. Signing you in…' : 'Welcome back. Signing you in…',
      toast: claimFailed
        ? {
            text: 'Signed in, but your provider role could not be applied. Try again or contact support.',
            type: 'error',
          }
        : {
            text: isNewAccount
              ? effectiveRole === 'provider'
                ? 'Provider account created with Google.'
                : 'Account created with Google.'
              : 'Signed in with Google.',
            type: 'info',
          },
      navigateTo: destination,
    }
  } catch (error) {
    clearOAuthSignupIntent()
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Google sign-in failed.',
    }
  }
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
    let alive = true

    if (!oauthFinishShared) {
      oauthFinishShared = finishOAuthCallback(signOut, refreshProfile).finally(() => {
        window.setTimeout(() => {
          oauthFinishShared = null
        }, 2000)
      })
    }

    void oauthFinishShared.then((result) => {
      if (!alive) return
      if (result.toast) showToast(result.toast.text, result.toast.type)
      if (result.navigateTo && result.status !== 'error') {
        navigate(result.navigateTo, { replace: true })
        return
      }
      setStatus(result.status)
      if (result.message) setMessage(result.message)
    })

    return () => {
      alive = false
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
