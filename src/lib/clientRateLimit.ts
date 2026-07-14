const STORE_PREFIX = 'msg-form-rl:'

/** Soft client-side throttle. Server rate limits remain the real control. */
export function isClientRateLimited(key: string, cooldownMs: number) {
  try {
    const raw = sessionStorage.getItem(STORE_PREFIX + key)
    if (!raw) return false
    const last = Number(raw)
    if (!Number.isFinite(last)) return false
    return Date.now() - last < cooldownMs
  } catch {
    return false
  }
}

export function markClientRateLimited(key: string) {
  try {
    sessionStorage.setItem(STORE_PREFIX + key, String(Date.now()))
  } catch {
    // ignore storage failures
  }
}

export function clientRateLimitMessage(cooldownMs: number) {
  const mins = Math.max(1, Math.ceil(cooldownMs / 60_000))
  return `Please wait about ${mins} minute${mins === 1 ? '' : 's'} before submitting again.`
}
