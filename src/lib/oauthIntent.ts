import { getAuthRouteUrl } from './authRoutes'

const OAUTH_ROLE_KEY = 'msg-oauth-intended-role'
const OAUTH_CONSENT_KEY = 'msg-oauth-privacy-consent'
const OAUTH_RETURN_KEY = 'msg-oauth-return-to'
const OAUTH_COOKIE = 'msg_oauth_intent'

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

function writeOAuthCookie(role: OAuthIntendedRole | '', returnTo: OAuthReturnTo) {
  try {
    const value = encodeURIComponent(`${returnTo}:${role || ''}`)
    // Lax so it returns with top-level OAuth redirects on the same site.
    document.cookie = `${OAUTH_COOKIE}=${value}; path=/; max-age=1800; SameSite=Lax`
  } catch {
    /* ignore */
  }
}

function readOAuthCookie(): { role: OAuthIntendedRole | null; returnTo: OAuthReturnTo } | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${OAUTH_COOKIE}=([^;]*)`))
    if (!match?.[1]) return null
    const raw = decodeURIComponent(match[1])
    const [returnToRaw, roleRaw] = raw.split(':')
    const returnTo: OAuthReturnTo = returnToRaw === 'register' ? 'register' : 'login'
    const role: OAuthIntendedRole | null =
      roleRaw === 'provider' || roleRaw === 'customer' ? roleRaw : null
    return { role, returnTo }
  } catch {
    return null
  }
}

function clearOAuthCookie() {
  try {
    document.cookie = `${OAUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`
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
  writeOAuthCookie(role, returnTo)
}

/** Login-only Google: keep cancel routing, never stash a role to apply. */
export function storeOAuthLoginIntent() {
  clearOAuthCallbackCache()
  storageRemove(OAUTH_ROLE_KEY)
  storageRemove(OAUTH_CONSENT_KEY)
  storageSet(OAUTH_RETURN_KEY, 'login')
  writeOAuthCookie('', 'login')
}

export function peekOAuthReturnTo(): OAuthReturnTo {
  if (storageGet(OAUTH_RETURN_KEY) === 'register') return 'register'
  if (storageGet(OAUTH_RETURN_KEY) === 'login') return 'login'
  const cookie = readOAuthCookie()
  if (cookie?.returnTo === 'register') return 'register'
  if (cookie?.returnTo === 'login') return 'login'
  return 'login'
}

export function clearOAuthSignupIntent() {
  storageRemove(OAUTH_ROLE_KEY)
  storageRemove(OAUTH_CONSENT_KEY)
  storageRemove(OAUTH_RETURN_KEY)
  clearOAuthCookie()
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
  const cookie = readOAuthCookie()

  const role: OAuthIntendedRole | null =
    roleRaw === 'provider' || roleRaw === 'customer'
      ? roleRaw
      : cookie?.role ?? null
  const returnTo: OAuthReturnTo =
    returnRaw === 'register' || cookie?.returnTo === 'register'
      ? 'register'
      : returnRaw === 'login' || cookie?.returnTo === 'login'
        ? 'login'
        : 'login'

  if (!role && !returnRaw && !cookie) return null
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

/**
 * Bare callback URL only. Role/intent live in storage + cookie.
 * Query params on redirectTo are often rejected by Supabase allow-lists and
 * then surface as access_denied / “cancelled” after Google.
 */
export function getOAuthCallbackUrl(_opts?: {
  role?: OAuthIntendedRole
  intent?: OAuthReturnTo
}) {
  return getAuthRouteUrl('/auth/callback')
}

/** @deprecated Query params are no longer used on the callback URL. */
export function readRoleFromCallbackUrl(): OAuthIntendedRole | null {
  return null
}

/** @deprecated Query params are no longer used on the callback URL. */
export function readIntentFromCallbackUrl(): OAuthReturnTo | null {
  return null
}

export const ACCOUNT_EXISTS_SIGN_IN_MESSAGE =
  'An account already exists for this email. Please sign in instead — you cannot create a second Customer or Provider account with the same email.'

export const NO_ACCOUNT_SIGN_UP_MESSAGE =
  'No account found for this Google login. Please create an account and choose Customer or Provider.'

export function isAccountExistsError(message: string) {
  return /already\s*(been\s*)?(registered|exists)|user already|email.*(taken|exists)|identity.*exist|second (customer|provider)|same email/i.test(
    message,
  )
}

/** Only treat explicit user-abort style errors as cancel — not redirect misconfig. */
export function isOAuthCancelError(message: string) {
  return /access_denied|user.?denied|popup.?closed|user cancelled|user canceled/i.test(message)
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

  const lastMs = Date.parse(lastSignInAt || '')
  if (Number.isFinite(lastMs) && Math.abs(lastMs - createdAtMs) < 60_000) return true
  return false
}
