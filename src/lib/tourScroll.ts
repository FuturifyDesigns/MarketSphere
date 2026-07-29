import { getLenis } from '../hooks/useLenis'
import type { OnboardingPlacement } from '../components/onboarding/onboardingSteps'

const NAVBAR_OFFSET = 76
const SPOTLIGHT_PADDING = 10
const VIEW_TOP_PAD = NAVBAR_OFFSET + SPOTLIGHT_PADDING + 12
const VIEW_BOTTOM_PAD = SPOTLIGHT_PADDING + 28

type TourScrollOptions = {
  centered?: boolean
  cardHeight?: number
  cardWidth?: number
  placement?: OnboardingPlacement
}

function getScrollTop() {
  const lenis = getLenis()
  return lenis?.scroll ?? window.scrollY
}

/** Lift overflow lock so the tour can scroll targets into view. */
function unlockForTourScroll() {
  if (typeof document === 'undefined') {
    return () => undefined
  }

  const html = document.documentElement
  const body = document.body
  const locked = html.classList.contains('body-scroll-locked')
  if (!locked) {
    return () => undefined
  }

  const prevHtmlOverflow = html.style.overflow
  const prevBodyOverflow = body.style.overflow
  html.style.overflow = ''
  body.style.overflow = ''

  let restored = false
  return () => {
    if (restored) return
    restored = true
    html.style.overflow = prevHtmlOverflow || 'hidden'
    body.style.overflow = prevBodyOverflow || 'hidden'
  }
}

function scrollToY(top: number, immediate = false, onComplete?: () => void) {
  const y = Math.max(0, Math.round(top))
  const restore = unlockForTourScroll()
  let done = false
  const finish = () => {
    if (done) return
    done = true
    restore()
    onComplete?.()
  }

  const lenis = getLenis()
  if (lenis) {
    // force: true scrolls even while Lenis is stopped for the tour lock.
    lenis.scrollTo(y, {
      duration: immediate ? 0 : 0.55,
      force: true,
      onComplete: finish,
    })
    window.setTimeout(finish, immediate ? 50 : 850)
    return
  }

  window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
  window.setTimeout(finish, immediate ? 50 : 480)
}

/**
 * Scroll so the highlighted target is fully visible in the viewport.
 * Tooltip placement is handled separately after the scroll settles — never
 * sacrifice the spotlight to make room for the card.
 */
export function scrollTourIntoView(
  element: HTMLElement | null,
  options: TourScrollOptions = {},
  onComplete?: () => void,
) {
  const { centered = false } = options

  if (centered || !element) {
    scrollToY(0, false, onComplete)
    return
  }

  const rect = element.getBoundingClientRect()
  const currentScroll = getScrollTop()
  const viewportHeight = window.innerHeight
  const available = Math.max(140, viewportHeight - VIEW_TOP_PAD - VIEW_BOTTOM_PAD)

  const elementTopDoc = currentScroll + rect.top
  const elementHeight = Math.max(rect.height, 1)

  let targetScroll: number
  if (elementHeight >= available) {
    // Tall target: pin its top just below the navbar so as much as possible shows.
    targetScroll = elementTopDoc - VIEW_TOP_PAD
  } else {
    // Center the full highlight in the usable viewport band.
    targetScroll = elementTopDoc - VIEW_TOP_PAD - (available - elementHeight) / 2
  }

  scrollToY(Math.max(0, targetScroll), false, onComplete)
}

export function scrollTourAfterLayout(
  element: HTMLElement | null,
  options: TourScrollOptions,
  onDone?: () => void,
) {
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    // Remeasure after layout catches up to the new scroll position.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => onDone?.())
    })
  }

  scrollTourIntoView(element, options, finish)
  window.setTimeout(finish, 900)
}
