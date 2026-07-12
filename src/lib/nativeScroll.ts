export const MOBILE_BREAKPOINT_MQ = '(max-width: 900px)'
export const COARSE_POINTER_MQ = '(pointer: coarse)'

/** Use native scrolling on touch / mobile for smoother performance. */
export function shouldUseNativeScroll() {
  if (typeof window === 'undefined') return true

  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia(MOBILE_BREAKPOINT_MQ).matches ||
    window.matchMedia(COARSE_POINTER_MQ).matches
  )
}

export function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_BREAKPOINT_MQ).matches
}
