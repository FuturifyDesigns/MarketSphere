export const INTRO_SEEN_KEY = 'marketsphere-intro-seen'
export const INTRO_COMPLETE_EVENT = 'site-intro-complete'

export function hasSeenIntro() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return true
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function dispatchIntroComplete() {
  window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT))
}

export function onIntroComplete(callback: () => void) {
  if (hasSeenIntro()) {
    callback()
    return () => {}
  }

  window.addEventListener(INTRO_COMPLETE_EVENT, callback, { once: true })
  return () => window.removeEventListener(INTRO_COMPLETE_EVENT, callback)
}
