import { getAuthRouteUrl } from './authRoutes'

const OAUTH_ROLE_KEY = 'msg-oauth-intended-role'
const OAUTH_CONSENT_KEY = 'msg-oauth-privacy-consent'
const OAUTH_RETURN_KEY = 'msg-oauth-return-to'

export type OAuthIntendedRole = 'customer' | 'provider'
export type OAuthReturnTo = 'login' | 'register'

function storageSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function storageGet(key: string): string | null {
  try {
    const fromSession = sessionStorage.getItem(key)
    if (fromSession) return fromSession
  } catch {
    /* ignore */
  }
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function storageRemove(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Cleared when a new Google OAuth attempt starts (login or signup). */
type OAuthFinishCache = {
  result: unknown | null
  shared: Promise<unknown> | null
}

const oauthFinishCache: OAuthFinishCache = {
  result: null,
  shared: null,
}

export function clearOAuthCallbackCache() {
  oauthFinishCache.result = null
  oauthFinishCache.shared = null
}

export function getOAuthFinishCache<T>(): {
  result: T | null
  shared: Promise<T> | null
} {
  return oauthFinishCache as { result: T | null; shared: Promise<T> | null }
}

export function setOAuthFinishShared<T>(promise: Promise<T>): Promise<T> {
  oauthFinishCache.shared = promise as Promise<unknown>
  return promise.then((result) => {
    oauthFinishCache.result = result
    return result
  })
}

export function storeOAuthSignupIntent(
  role: OAuthIntendedRole,
  privacyConsent: boolean,
  returnTo: OAuthReturnTo = 'register',
) {
  clearOAuthCallbackCache()
  storageSet(OAUTH_ROLE_KEY, role)
  storageSet(OAUTH_CONSENT_KEY, privacyConsent ? '1' : '0')
  storageSet(OAUTH_RETURN_KEY, returnTo)
}

/** Login-only Google: keep cancel routing, never stash a role to apply. */
export function storeOAuthLoginIntent() {
  clearOAuthCallbackCache()
  storageRemove(OAUTH_ROLE_KEY)
  storageRemove(OAUTH_CONSENT_KEY)
  storageSet(OAUTH_RETURN_KEY, 'login')
}

export function peekOAuthReturnTo(): OAuthReturnTo {
  return storageGet(OAUTH_RETURN_KEY) === 'register' ? 'register' : 'login'
}

export function clearOAuthSignupIntent() {
  storageRemove(OAUTH_ROLE_KEY)
  storageRemove(OAUTH_CONSENT_KEY)
  storageRemove(OAUTH_RETURN_KEY)
}

/** Read stashed OAuth signup intent without clearing (safe under React Strict Mode). */
export function peekOAuthSignupIntent(): {
  role: OAuthIntendedRole | null
  privacyConsent: boolean
  returnTo: OAuthReturnTo
} | null {
  const roleRaw = storageGet(OAUTH_ROLE_KEY)
  const consentRaw = storageGet(OAUTH_CONSENT_KEY)
  const returnRaw = storageGet(OAUTH_RETURN_KEY)
  if (!roleRaw && !returnRaw) return null
  const role: OAuthIntendedRole | null =
    roleRaw === 'provider' || roleRaw === 'customer' ? roleRaw : null
  const returnTo: OAuthReturnTo = returnRaw === 'register' ? 'register' : 'login'
  return { role, privacyConsent: consentRaw === '1', returnTo }
}

/** @deprecated Prefer peekOAuthSignupIntent + clearOAuthSignupIntent after success. */
export function consumeOAuthSignupIntent(): {
  role: OAuthIntendedRole | null
  privacyConsent: boolean
  returnTo: OAuthReturnTo
} | null {
  const intent = peekOAuthSignupIntent()
  clearOAuthSignupIntent()
  return intent
}

function readCallbackParams() {
  const fromSearch = new URLSearchParams(window.location.search)
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  // Support both `#role=provider` and `#/path?role=provider`
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : hash
  const fromHash = new URLSearchParams(hashQuery)
  return {
    role: fromSearch.get('role') || fromHash.get('role'),
    intent: fromSearch.get('intent') || fromHash.get('intent'),
  }
}

/**
 * Absolute callback URL Supabase returns to with ?code=…&state=….
 * Role/intent travel in the query string AND in local/session storage.
 * Do not put a hash on redirectTo — OAuth providers often reject or strip it
 * and the flow then looks like a cancelled sign-in.
 */
export function getOAuthCallbackUrl(opts?: {
  role?: OAuthIntendedRole
  intent?: OAuthReturnTo
}) {
  const url = getAuthRouteUrl('/auth/callback')
  const params = new URLSearchParams()
  if (opts?.intent) params.set('intent', opts.intent)
  if (opts?.role) params.set('role', opts.role)
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

/** Role carried back on the callback URL, used when storage was lost. */
export function readRoleFromCallbackUrl(): OAuthIntendedRole | null {
  try {
    const role = readCallbackParams().role
    if (role === 'provider' || role === 'customer') return role
    return null
  } catch {
    return null
  }
}

/** Signup vs login, from callback URL when storage was lost. */
export function readIntentFromCallbackUrl(): OAuthReturnTo | null {
  try {
    const intent = readCallbackParams().intent
    if (intent === 'register' || intent === 'login') return intent
    return null
  } catch {
    return null
  }
}

export const ACCOUNT_EXISTS_SIGN_IN_MESSAGE =
  'An account already exists for this email. Please sign in instead.'

export const NO_ACCOUNT_SIGN_UP_MESSAGE =
  'No account found for this Google login. Please create an account and choose Customer or Provider.'

export function isAccountExistsError(message: string) {
  return /already\s*(been\s*)?(registered|exists)|user already|email.*(taken|exists)|identity.*exist/i.test(
    message,
  )
}

export function isOAuthCancelError(message: string) {
  return /access_denied|user.?denied|cancelled|canceled|consent.?required/i.test(message)
}

/** True when this Google auth.users row was just created / first sign-in. */
export function isBrandNewAuthUser(
  createdAt: string | undefined,
  lastSignInAt?: string | undefined,
  windowMs = 24 * 60 * 60 * 1000,
) {
  const createdAtMs = Date.parse(createdAt || '')
  if (!Number.isFinite(createdAtMs)) return false
  if (Date.now() - createdAtMs < windowMs) return true

  // First sign-in often equals created_at even when clocks drift slightly.
  const lastMs = Date.parse(lastSignInAt || '')
  if (Number.isFinite(lastMs) && Math.abs(lastMs - createdAtMs) < 60_000) return true
  return false
}
