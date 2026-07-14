type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const memory = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = memory.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memory.delete(key)
    return null
  }
  return entry.value as T
}

export function setCached<T>(key: string, value: T, ttlMs: number) {
  memory.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function clearCached(key: string) {
  memory.delete(key)
}

/** Coalesce concurrent identical fetches into one network call. */
export async function withSingleFlight<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const promise = fetcher().finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, promise)
  return promise
}

export function readSessionJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (!parsed || typeof parsed.expiresAt !== 'number') return null
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(key)
      return null
    }
    return parsed.value
  } catch {
    return null
  }
}

export function writeSessionJson<T>(key: string, value: T, ttlMs: number) {
  try {
    const payload: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs }
    sessionStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // quota / private mode — ignore
  }
}

export function debounceTrailing<T extends unknown[]>(
  fn: (...args: T) => void,
  waitMs: number,
): ((...args: T) => void) & { cancel: () => void } {
  let timer: number | undefined
  const wrapped = ((...args: T) => {
    if (timer !== undefined) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = undefined
      fn(...args)
    }, waitMs)
  }) as ((...args: T) => void) & { cancel: () => void }

  wrapped.cancel = () => {
    if (timer !== undefined) window.clearTimeout(timer)
    timer = undefined
  }

  return wrapped
}
