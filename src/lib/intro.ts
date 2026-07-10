export const INTRO_SEEN_KEY = 'marketsphere-intro-seen'
export const INTRO_COMPLETE_EVENT = 'site-intro-complete'

let introComplete = false

try {
  introComplete = sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
} catch {
  introComplete = false
}

export function hasSeenIntro() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return introComplete
  }
}

export function isIntroComplete() {
  return introComplete || hasSeenIntro()
}

export function markIntroSeen() {
  introComplete = true
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
  if (introComplete) return
  introComplete = true
  document.body.classList.remove('intro-active')
  window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT))
}

export function onIntroComplete(callback: () => void) {
  if (isIntroComplete()) {
    window.requestAnimationFrame(() => callback())
    return () => {}
  }

  const handler = () => callback()
  window.addEventListener(INTRO_COMPLETE_EVENT, handler, { once: true })
  return () => window.removeEventListener(INTRO_COMPLETE_EVENT, handler)
}

export function resetIntroActiveClass() {
  document.body.classList.remove('intro-active')
}
