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
  NO_ACCOUNT_SIGN_UP_MESSAGE,
  clearOAuthSignupIntent,
  getOAuthFinishCache,
  isBrandNewAuthUser,
  isOAuthCancelError,
  peekOAuthReturnTo,
  peekOAuthSignupIntent,
  setOAuthFinishShared,
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

function resolveIntendedRole(): {
  fromRegister: boolean
  fromLogin: boolean
  intendedRole: OAuthIntendedRole | null
} {
  const intent = peekOAuthSignupIntent()
  const fromRegister = intent?.returnTo === 'register' || Boolean(intent?.role)
  const fromLogin = !fromRegister && (intent?.returnTo === 'login' || peekOAuthReturnTo() === 'login')
  const intendedRole = fromRegister ? intent?.role ?? null : null
  return { fromRegister, fromLogin, intendedRole }
}

async function finishOAuthCallback(
  signOut: () => Promise<void>,
  refreshProfile: () => Promise<void>,
): Promise<OAuthFinishResult> {
  try {
    const { code, errorDescription } = readOAuthParams()
    const hadCode = Boolean(code)
    const { fromRegister, fromLogin, intendedRole } = resolveIntendedRole()
    const returnTo: '/login' | '/register' =
      fromRegister || peekOAuthReturnTo() === 'register' ? '/register' : '/login'

    if (errorDescription) {
      const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
      clearOAuthSignupIntent()
      clearOAuthParamsFromUrl()

      const incomplete =
        returnTo === '/register'
          ? 'Google sign-up did not complete. Please try Continue with Google again.'
          : 'Google sign-in did not complete. Please try again or use email.'

      // Redirect allow-list mistakes often arrive as access_denied — don't call that "cancelled".
      if (/redirect|allow.?list|not allowed|invalid.*redirect/i.test(decoded)) {
        return {
          status: 'loading',
          message: '',
          toast: {
            text: 'Google redirect is not allowed for this site. Add https://marketspheregroup.com/auth/callback in Supabase Auth → URL configuration.',
            type: 'error',
          },
          navigateTo: returnTo,
        }
      }

      return {
        status: 'loading',
        message: '',
        toast: {
          text: isOAuthCancelError(decoded) ? incomplete : decoded || incomplete,
          type: isOAuthCancelError(decoded) ? 'info' : 'error',
        },
        navigateTo: returnTo,
      }
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        const {
          data: { session: existing },
        } = await supabase.auth.getSession()
        if (!existing) {
          clearOAuthSignupIntent()
          clearOAuthParamsFromUrl()
          const incomplete =
            returnTo === '/register'
              ? 'Google sign-up did not complete. Please try Continue with Google again.'
              : 'Google sign-in did not complete. Please try again or use email.'
          return {
            status: 'loading',
            message: '',
            toast: {
              text: isOAuthCancelError(error.message) ? incomplete : error.message || incomplete,
              type: 'error',
            },
            navigateTo: returnTo,
          }
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

      if (fromRegister || returnTo === '/register') {
        return {
          status: 'loading',
          message: '',
          toast: {
            text: 'Google sign-up did not complete. Please try Continue with Google again.',
            type: 'info',
          },
          navigateTo: '/register',
        }
      }

      if (hadCode || fromLogin) {
        return {
          status: 'loading',
          message: '',
          toast: { text: NO_ACCOUNT_SIGN_UP_MESSAGE, type: 'info' },
          navigateTo: '/register',
        }
      }

      return {
        status: 'loading',
        message: '',
        toast: {
          text: 'Google sign-in did not complete. Please try again or use email.',
          type: 'info',
        },
        navigateTo: '/login',
      }
    }

    const again = resolveIntendedRole()
    const effectiveFromRegister = fromRegister || again.fromRegister
    const effectiveFromLogin = fromLogin || again.fromLogin || !effectiveFromRegister
    const effectiveRole = intendedRole ?? again.intendedRole
    const isNewAccount = isBrandNewAuthUser(
      session.user.created_at,
      session.user.last_sign_in_at ?? session.user.created_at,
    )

    if (effectiveFromLogin && isNewAccount) {
      await signOut()
      clearOAuthSignupIntent()
      clearOAuthParamsFromUrl()
      return {
        status: 'loading',
        message: '',
        toast: { text: NO_ACCOUNT_SIGN_UP_MESSAGE, type: 'info' },
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

function ensureOAuthFinish(
  signOut: () => Promise<void>,
  refreshProfile: () => Promise<void>,
): Promise<OAuthFinishResult> {
  const cache = getOAuthFinishCache<OAuthFinishResult>()
  if (cache.result) return Promise.resolve(cache.result)
  if (cache.shared) return cache.shared
  return setOAuthFinishShared(finishOAuthCallback(signOut, refreshProfile))
}

export function AuthCallback() {
  const pageRef = useRef<HTMLDivElement>(null)
  useAuthPageEnter(pageRef)
  const navigate = useNavigate()
  const { refreshProfile, signOut } = useAuth()
  const { showToast } = useToast()
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [message, setMessage] = useState('Finishing Google sign-in…')

  const signOutRef = useRef(signOut)
  const refreshRef = useRef(refreshProfile)
  const navigateRef = useRef(navigate)
  const toastRef = useRef(showToast)
  signOutRef.current = signOut
  refreshRef.current = refreshProfile
  navigateRef.current = navigate
  toastRef.current = showToast

  useEffect(() => {
    void ensureOAuthFinish(
      () => signOutRef.current(),
      () => refreshRef.current(),
    ).then((result) => {
      // Always apply navigation/toast — do not drop the result on Strict Mode remounts.
      if (result.toast) toastRef.current(result.toast.text, result.toast.type)
      if (result.navigateTo && result.status !== 'error') {
        navigateRef.current(result.navigateTo, { replace: true })
        return
      }
      setStatus(result.status)
      if (result.message) setMessage(result.message)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
