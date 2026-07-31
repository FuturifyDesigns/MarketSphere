import { getAuthRouteUrl } from './authRoutes'

const OAUTH_ROLE_KEY = 'msg-oauth-intended-role'
const OAUTH_CONSENT_KEY = 'msg-oauth-privacy-consent'
const OAUTH_RETURN_KEY = 'msg-oauth-return-to'

export type OAuthIntendedRole = 'customer' | 'provider'
export type OAuthReturnTo = 'login' | 'register'

export function storeOAuthSignupIntent(
  role: OAuthIntendedRole,
  privacyConsent: boolean,
  returnTo: OAuthReturnTo = 'register',
) {
  try {
    sessionStorage.setItem(OAUTH_ROLE_KEY, role)
    sessionStorage.setItem(OAUTH_CONSENT_KEY, privacyConsent ? '1' : '0')
    sessionStorage.setItem(OAUTH_RETURN_KEY, returnTo)
  } catch {
    /* ignore quota / private mode */
  }
}

/** Login-only Google: keep cancel routing, never stash a role to apply. */
export function storeOAuthLoginIntent() {
  try {
    sessionStorage.removeItem(OAUTH_ROLE_KEY)
    sessionStorage.removeItem(OAUTH_CONSENT_KEY)
    sessionStorage.setItem(OAUTH_RETURN_KEY, 'login')
  } catch {
    /* ignore */
  }
}

export function peekOAuthReturnTo(): OAuthReturnTo {
  try {
    return sessionStorage.getItem(OAUTH_RETURN_KEY) === 'register' ? 'register' : 'login'
  } catch {
    return 'login'
  }
}

export function clearOAuthSignupIntent() {
  try {
    sessionStorage.removeItem(OAUTH_ROLE_KEY)
    sessionStorage.removeItem(OAUTH_CONSENT_KEY)
    sessionStorage.removeItem(OAUTH_RETURN_KEY)
  } catch {
    /* ignore */
  }
}

export function consumeOAuthSignupIntent(): {
  role: OAuthIntendedRole | null
  privacyConsent: boolean
  returnTo: OAuthReturnTo
} | null {
  try {
    const roleRaw = sessionStorage.getItem(OAUTH_ROLE_KEY)
    const consentRaw = sessionStorage.getItem(OAUTH_CONSENT_KEY)
    const returnRaw = sessionStorage.getItem(OAUTH_RETURN_KEY)
    clearOAuthSignupIntent()
    if (!roleRaw && !returnRaw) return null
    const role: OAuthIntendedRole | null =
      roleRaw === 'provider' || roleRaw === 'customer' ? roleRaw : null
    const returnTo: OAuthReturnTo = returnRaw === 'register' ? 'register' : 'login'
    return { role, privacyConsent: consentRaw === '1', returnTo }
  } catch {
    return null
  }
}

/** Absolute callback URL Supabase returns to with ?code=…&state=… */
export function getOAuthCallbackUrl(role?: OAuthIntendedRole) {
  const url = getAuthRouteUrl('/auth/callback')
  // sessionStorage is per-origin and is lost if Supabase falls back to the
  // configured Site URL instead of returning to the origin we started on, so
  // the role also travels in the redirect URL. This grants no extra privilege:
  // claim_provider_role only ever upgrades the caller's own customer profile.
  return role ? `${url}?role=${encodeURIComponent(role)}` : url
}

/** Role carried back on the callback URL, used when sessionStorage was lost. */
export function readRoleFromCallbackUrl(): OAuthIntendedRole | null {
  try {
    const fromSearch = new URLSearchParams(window.location.search).get('role')
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
    const role = fromSearch || new URLSearchParams(hashQuery).get('role')
    if (role === 'provider' || role === 'customer') return role
    return null
  } catch {
    return null
  }
}

export function isOAuthCancelError(message: string) {
  return /access_denied|user.?denied|cancelled|canceled|consent.?required/i.test(message)
}
