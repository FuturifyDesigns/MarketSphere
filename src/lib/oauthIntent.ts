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

export function storeOAuthSignupIntent(
  role: OAuthIntendedRole,
  privacyConsent: boolean,
  returnTo: OAuthReturnTo = 'register',
) {
  storageSet(OAUTH_ROLE_KEY, role)
  storageSet(OAUTH_CONSENT_KEY, privacyConsent ? '1' : '0')
  storageSet(OAUTH_RETURN_KEY, returnTo)
}

/** Login-only Google: keep cancel routing, never stash a role to apply. */
export function storeOAuthLoginIntent() {
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
 * Role/intent are also mirrored into the hash so they survive when GoTrue
 * rebuilds the redirect URL and drops custom query params.
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
  // Query + hash: query helps when preserved; hash is kept by the browser even
  // if the IdP/GoTrue only round-trips the path + auth code query.
  return qs ? `${url}?${qs}#${qs}` : url
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

/** True when this Google auth.users row was just created (first OAuth). */
export function isBrandNewAuthUser(createdAt: string | undefined, windowMs = 10 * 60 * 1000) {
  const createdAtMs = Date.parse(createdAt || '')
  return Number.isFinite(createdAtMs) && Date.now() - createdAtMs < windowMs
}

export const ACCOUNT_EXISTS_SIGN_IN_MESSAGE =
  'An account already exists for this email. Please sign in instead.'

export function isAccountExistsError(message: string) {
  return /already\s*(been\s*)?(registered|exists)|user already|email.*(taken|exists)|identity.*exist/i.test(
    message,
  )
}

export function isOAuthCancelError(message: string) {
  return /access_denied|user.?denied|cancelled|canceled|consent.?required/i.test(message)
}
