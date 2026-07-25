import { getAuthRouteUrl } from './authRoutes'

const OAUTH_ROLE_KEY = 'msg-oauth-intended-role'
const OAUTH_CONSENT_KEY = 'msg-oauth-privacy-consent'

export type OAuthIntendedRole = 'customer' | 'provider'

export function storeOAuthSignupIntent(role: OAuthIntendedRole, privacyConsent: boolean) {
  try {
    sessionStorage.setItem(OAUTH_ROLE_KEY, role)
    sessionStorage.setItem(OAUTH_CONSENT_KEY, privacyConsent ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeOAuthSignupIntent(): {
  role: OAuthIntendedRole
  privacyConsent: boolean
} | null {
  try {
    const roleRaw = sessionStorage.getItem(OAUTH_ROLE_KEY)
    const consentRaw = sessionStorage.getItem(OAUTH_CONSENT_KEY)
    sessionStorage.removeItem(OAUTH_ROLE_KEY)
    sessionStorage.removeItem(OAUTH_CONSENT_KEY)
    if (!roleRaw) return null
    const role: OAuthIntendedRole = roleRaw === 'provider' ? 'provider' : 'customer'
    return { role, privacyConsent: consentRaw === '1' }
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
