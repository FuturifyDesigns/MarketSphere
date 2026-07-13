const EXIT_INTENT_KEY = 'marketsphere-exit-intent-dismissed'

export function hasDismissedExitIntent() {
  try {
    return sessionStorage.getItem(EXIT_INTENT_KEY) === '1'
  } catch {
    return false
  }
}

export function markExitIntentDismissed() {
  try {
    sessionStorage.setItem(EXIT_INTENT_KEY, '1')
  } catch {
    /* ignore */
  }
}
