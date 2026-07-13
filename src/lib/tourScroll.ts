import { getLenis } from '../hooks/useLenis'
import type { OnboardingPlacement } from '../components/onboarding/onboardingSteps'

const NAVBAR_OFFSET = 76
const TOOLTIP_GAP = 16
const TOOLTIP_MARGIN = 16
const SPOTLIGHT_PADDING = 10

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

function scrollToY(top: number, immediate = false) {
  const y = Math.max(0, Math.round(top))
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(y, { duration: immediate ? 0 : 0.75, force: true })
    return
  }
  window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
}

export function scrollTourIntoView(element: HTMLElement | null, options: TourScrollOptions = {}) {
  const {
    centered = false,
    cardHeight = 420,
    cardWidth = 400,
    placement = 'right',
  } = options

  if (centered || !element) {
    scrollToY(0)
    return
  }

  const rect = element.getBoundingClientRect()
  const currentScroll = getScrollTop()
  const viewportHeight = window.innerHeight
  const pad = TOOLTIP_MARGIN + SPOTLIGHT_PADDING
  let targetScroll = currentScroll

  const spotlightTop = rect.top
  const spotlightBottom = rect.bottom
  const spotlightHeight = rect.height

  if (spotlightTop < NAVBAR_OFFSET + pad) {
    targetScroll += spotlightTop - (NAVBAR_OFFSET + pad)
  } else if (spotlightBottom > viewportHeight - pad) {
    targetScroll += spotlightBottom - (viewportHeight - pad)
  }

  const shiftedTop = spotlightTop - (targetScroll - currentScroll)
  const shiftedBottom = spotlightBottom - (targetScroll - currentScroll)

  let tooltipTop = 0
  let tooltipBottom = 0

  if (placement === 'left' || placement === 'right') {
    tooltipTop = shiftedTop + spotlightHeight / 2 - cardHeight / 2
    tooltipBottom = tooltipTop + cardHeight
  } else if (placement === 'bottom') {
    tooltipTop = shiftedBottom + TOOLTIP_GAP
    tooltipBottom = tooltipTop + cardHeight
  } else {
    tooltipTop = shiftedTop - TOOLTIP_GAP - cardHeight
    tooltipBottom = tooltipTop + cardHeight
  }

  if (tooltipBottom > viewportHeight - pad) {
    targetScroll += tooltipBottom - (viewportHeight - pad)
  }
  if (tooltipTop < NAVBAR_OFFSET + pad) {
    targetScroll += tooltipTop - (NAVBAR_OFFSET + pad)
  }

  if (placement === 'right') {
    const tooltipLeft = rect.right + TOOLTIP_GAP
    const tooltipRight = tooltipLeft + cardWidth
    if (tooltipRight > window.innerWidth - pad) {
      targetScroll += Math.min(0, window.innerWidth - pad - tooltipRight)
    }
  }

  scrollToY(targetScroll)
}

export function scrollTourAfterLayout(
  element: HTMLElement | null,
  options: TourScrollOptions,
  onDone?: () => void,
) {
  scrollTourIntoView(element, options)

  const lenis = getLenis()
  if (!lenis) {
    window.setTimeout(() => onDone?.(), 320)
    return
  }

  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    onDone?.()
  }

  const timeout = window.setTimeout(() => finish(), 900)
  const onScroll = () => {
    window.clearTimeout(timeout)
    window.setTimeout(() => finish(), 120)
  }

  lenis.on('scroll', onScroll)
  window.setTimeout(() => {
    lenis.off('scroll', onScroll)
    finish()
  }, 1000)
}
