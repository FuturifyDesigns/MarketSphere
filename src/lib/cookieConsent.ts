export const COOKIE_POLICY_VERSION = '2025-07-13'

const CONSENT_KEY = 'msg-cookie-consent'
const CONSENT_LOG_KEY = 'msg-cookie-consent-log'

export type CookiePreference = 'accepted' | 'declined'

export interface CookieConsentRecord {
  preference: CookiePreference
  timestamp: string
  version: string
}

export function readCookieConsent(): CookieConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsentRecord
    if (parsed.preference !== 'accepted' && parsed.preference !== 'declined') return null
    return parsed
  } catch {
    return null
  }
}

export function writeCookieConsent(preference: CookiePreference) {
  const record: CookieConsentRecord = {
    preference,
    timestamp: new Date().toISOString(),
    version: COOKIE_POLICY_VERSION,
  }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
  appendConsentLog(record)
  applyCookiePreference(preference)
  return record
}

function appendConsentLog(record: CookieConsentRecord) {
  try {
    const raw = localStorage.getItem(CONSENT_LOG_KEY)
    const log: CookieConsentRecord[] = raw ? (JSON.parse(raw) as CookieConsentRecord[]) : []
    log.push(record)
    localStorage.setItem(CONSENT_LOG_KEY, JSON.stringify(log.slice(-20)))
  } catch {
    localStorage.setItem(CONSENT_LOG_KEY, JSON.stringify([record]))
  }
}

/** Essential cookies only — auth session and consent storage are always permitted. */
export function applyCookiePreference(preference: CookiePreference) {
  if (preference === 'accepted') {
    document.documentElement.setAttribute('data-cookie-consent', 'accepted')
    enableOptionalCookies()
    return
  }

  document.documentElement.setAttribute('data-cookie-consent', 'declined')
  disableOptionalCookies()
}

function enableOptionalCookies() {
  // Reserved for future analytics or marketing tags — only activated after opt-in.
  window.dispatchEvent(new CustomEvent('msg:optional-cookies-enabled'))
}

function disableOptionalCookies() {
  window.dispatchEvent(new CustomEvent('msg:optional-cookies-disabled'))
}

export function initCookieConsent() {
  const record = readCookieConsent()
  if (record) {
    applyCookiePreference(record.preference)
  }
}
