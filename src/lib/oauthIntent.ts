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
  role: OAuthIntendedRole
  privacyConsent: boolean
  returnTo: OAuthReturnTo
} | null {
  try {
    const roleRaw = sessionStorage.getItem(OAUTH_ROLE_KEY)
    const consentRaw = sessionStorage.getItem(OAUTH_CONSENT_KEY)
    const returnRaw = sessionStorage.getItem(OAUTH_RETURN_KEY)
    clearOAuthSignupIntent()
    if (!roleRaw && !returnRaw) return null
    const role: OAuthIntendedRole = roleRaw === 'provider' ? 'provider' : 'customer'
    const returnTo: OAuthReturnTo = returnRaw === 'register' ? 'register' : 'login'
    return { role, privacyConsent: consentRaw === '1', returnTo }
  } catch {
    return null
  }
}

/**
 * OAuth redirect URLs cannot include a hash fragment (browsers strip it).
 * Use a real path so the host receives /auth/callback?code=…&state=…
 * and route-bootstrap can rewrite it to #/auth/callback?code=…&state=…
 */
export function getOAuthCallbackUrl() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}/auth/callback`
}

/** Hash-router URL for in-app navigation after OAuth completes. */
export function getOAuthCallbackHashUrl() {
  return getAuthRouteUrl('/auth/callback')
}

export function isOAuthCancelError(message: string) {
  return /access_denied|user.?denied|cancelled|canceled|consent.?required/i.test(message)
}
