const REMEMBER_FLAG_KEY = 'msg-auth-remember'
const REMEMBERED_EMAIL_KEY = 'msg-auth-email'

function readFlag(): boolean {
  try {
    const raw = localStorage.getItem(REMEMBER_FLAG_KEY)
    // Default to remember for returning users who never chose.
    if (raw == null) return true
    return raw === '1'
  } catch {
    return true
  }
}

/** Whether the user wants the session to survive browser restarts. */
export function getRememberMe(): boolean {
  return readFlag()
}

export function setRememberMe(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_FLAG_KEY, remember ? '1' : '0')
  } catch {
    // ignore quota / private mode
  }
}

export function getRememberedEmail(): string {
  try {
    if (!getRememberMe()) return ''
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

export function setRememberedEmail(email: string | null) {
  try {
    if (!email) {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      return
    }
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
  } catch {
    // ignore
  }
}

/**
 * Apply remember-me choice before sign-in so the next session write
 * lands in the correct browser storage (local vs session).
 */
export function applyRememberMePreference(remember: boolean, email?: string) {
  setRememberMe(remember)
  if (remember && email) setRememberedEmail(email.trim())
  else setRememberedEmail(null)

  // Move any existing supabase auth payload to the chosen storage.
  migrateAuthPayload(remember)
}

function migrateAuthPayload(remember: boolean) {
  try {
    const keys = new Set<string>()
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && isAuthStorageKey(key)) keys.add(key)
    }
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key && isAuthStorageKey(key)) keys.add(key)
    }

    for (const key of keys) {
      const localValue = localStorage.getItem(key)
      const sessionValue = sessionStorage.getItem(key)
      const value = remember ? localValue ?? sessionValue : sessionValue ?? localValue
      if (!value) continue
      if (remember) {
        localStorage.setItem(key, value)
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, value)
        localStorage.removeItem(key)
      }
    }
  } catch {
    // ignore
  }
}

function isAuthStorageKey(key: string) {
  return key.startsWith('sb-') && key.includes('-auth-token')
}

/**
 * Supabase auth storage that respects Remember me:
 * - remembered → localStorage (persists after browser close)
 * - not remembered → sessionStorage (cleared when the tab/window closes)
 */
export const authStorage = {
  getItem(key: string) {
    try {
      if (getRememberMe()) {
        return localStorage.getItem(key) ?? sessionStorage.getItem(key)
      }
      return sessionStorage.getItem(key) ?? localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string) {
    try {
      if (getRememberMe()) {
        localStorage.setItem(key, value)
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, value)
        localStorage.removeItem(key)
      }
    } catch {
      // ignore
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}
