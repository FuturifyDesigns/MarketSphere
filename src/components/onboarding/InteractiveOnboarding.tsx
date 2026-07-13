import { useCallback, useEffect, useId, useLayoutEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { MASCOT_PATHS } from '../../lib/mascots'
import { Button } from '../ui/Button'
import type { OnboardingPlacement, OnboardingStep } from './onboardingSteps'
import './Onboarding.css'

const SPOTLIGHT_PADDING = 10
const TOOLTIP_GAP = 14
const TOOLTIP_MARGIN = 12

type SpotlightRect = {
  top: number
  left: number
  width: number
  height: number
}

type InteractiveOnboardingProps = {
  open: boolean
  steps: OnboardingStep[]
  eyebrow?: string
  onComplete: () => void
  onDismiss?: () => void
  onStepEnter?: (step: OnboardingStep, index: number) => void
  finishLabel?: string
  showSkip?: boolean
}

function isCenterStep(step: OnboardingStep) {
  return !step.target || step.placement === 'center'
}

function measureTarget(targetId: string | undefined): SpotlightRect | null {
  if (!targetId) return null
  const element = document.querySelector<HTMLElement>(`[data-onboarding="${targetId}"]`)
  if (!element) return null

  const rect = element.getBoundingClientRect()
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  }
}

function getTooltipPosition(
  rect: SpotlightRect | null,
  placement: OnboardingPlacement | undefined,
  cardWidth: number,
  cardHeight: number,
): CSSProperties {
  if (!rect) {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(100%, 540px)',
    }
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  let resolvedPlacement = placement ?? 'bottom'

  if (resolvedPlacement !== 'center') {
    const spaceBelow = viewportHeight - (rect.top + rect.height)
    const spaceAbove = rect.top
    if (resolvedPlacement === 'bottom' && spaceBelow < cardHeight + TOOLTIP_GAP && spaceAbove > spaceBelow) {
      resolvedPlacement = 'top'
    }
    if (resolvedPlacement === 'top' && spaceAbove < cardHeight + TOOLTIP_GAP && spaceBelow > spaceAbove) {
      resolvedPlacement = 'bottom'
    }
  }

  const clampLeft = (left: number) =>
    Math.max(TOOLTIP_MARGIN, Math.min(left, viewportWidth - cardWidth - TOOLTIP_MARGIN))

  if (resolvedPlacement === 'top') {
    const top = Math.max(TOOLTIP_MARGIN, rect.top - cardHeight - TOOLTIP_GAP)
    const left = clampLeft(rect.left + rect.width / 2 - cardWidth / 2)
    return { position: 'fixed', top, left, width: cardWidth }
  }

  if (resolvedPlacement === 'left') {
    const left = Math.max(TOOLTIP_MARGIN, rect.left - cardWidth - TOOLTIP_GAP)
    const top = Math.max(
      TOOLTIP_MARGIN,
      Math.min(rect.top + rect.height / 2 - cardHeight / 2, viewportHeight - cardHeight - TOOLTIP_MARGIN),
    )
    return { position: 'fixed', top, left, width: cardWidth }
  }

  if (resolvedPlacement === 'right') {
    const left = Math.min(rect.left + rect.width + TOOLTIP_GAP, viewportWidth - cardWidth - TOOLTIP_MARGIN)
    const top = Math.max(
      TOOLTIP_MARGIN,
      Math.min(rect.top + rect.height / 2 - cardHeight / 2, viewportHeight - cardHeight - TOOLTIP_MARGIN),
    )
    return { position: 'fixed', top, left, width: cardWidth }
  }

  const top = Math.min(rect.top + rect.height + TOOLTIP_GAP, viewportHeight - cardHeight - TOOLTIP_MARGIN)
  const left = clampLeft(rect.left + rect.width / 2 - cardWidth / 2)
  return { position: 'fixed', top, left, width: cardWidth }
}

export function InteractiveOnboarding({
  open,
  steps,
  eyebrow,
  onComplete,
  onDismiss,
  onStepEnter,
  finishLabel = 'Get started',
  showSkip = true,
}: InteractiveOnboardingProps) {
  const maskId = useId().replace(/:/g, '')
  const [stepIndex, setStepIndex] = useState(0)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({})
  const step = steps[stepIndex]
  const isLast = stepIndex >= steps.length - 1
  const isFirst = stepIndex === 0
  const dismiss = onDismiss ?? onComplete
  const centered = step ? isCenterStep(step) : true

  const refreshSpotlight = useCallback(() => {
    if (!step || isCenterStep(step)) {
      setSpotlight(null)
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(100%, 540px)',
      })
      return
    }

    const rect = measureTarget(step.target)
    setSpotlight(rect)

    const cardWidth = Math.min(420, window.innerWidth - TOOLTIP_MARGIN * 2)
    const estimatedHeight = 360
    setTooltipStyle(getTooltipPosition(rect, step.placement, cardWidth, estimatedHeight))
  }, [step])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open || !step) return

    onStepEnter?.(step, stepIndex)

    const element = step.target
      ? document.querySelector<HTMLElement>(`[data-onboarding="${step.target}"]`)
      : null

    element?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

    const timers = [0, 120, 320, 600].map((delay) => window.setTimeout(refreshSpotlight, delay))

    const onLayoutChange = () => refreshSpotlight()
    window.addEventListener('resize', onLayoutChange)
    window.addEventListener('scroll', onLayoutChange, true)

    let observer: ResizeObserver | undefined
    if (element && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(onLayoutChange)
      observer.observe(element)
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('resize', onLayoutChange)
      window.removeEventListener('scroll', onLayoutChange, true)
      observer?.disconnect()
    }
  }, [open, step, stepIndex, onStepEnter, refreshSpotlight])

  if (!open || !step) return null

  const handleNext = () => {
    if (isLast) {
      onComplete()
      return
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1))
  }

  const handleBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  const handleSkip = () => {
    dismiss()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="onboarding-overlay onboarding-overlay--interactive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="presentation"
        >
          <svg className="onboarding-spotlight" aria-hidden="true">
            <defs>
              <mask id={maskId}>
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spotlight ? (
                  <rect
                    x={spotlight.left}
                    y={spotlight.top}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx="14"
                    ry="14"
                    fill="black"
                  />
                ) : null}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(10, 12, 16, 0.62)"
              mask={`url(#${maskId})`}
            />
          </svg>

          {spotlight ? (
            <div
              className="onboarding-spotlight__ring"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
              }}
              aria-hidden="true"
            />
          ) : null}

          <motion.div
            className={`onboarding-card${centered ? ' onboarding-card--centered' : ' onboarding-card--docked'}`}
            style={tooltipStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={{ opacity: 0, y: centered ? 24 : 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {showSkip ? (
              <button type="button" className="onboarding-card__skip" onClick={handleSkip}>
                Skip tour
              </button>
            ) : null}

            <button
              type="button"
              className="onboarding-card__close"
              onClick={handleSkip}
              aria-label="Close"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="onboarding-card__top">
              {steps.length > 1 ? (
                <div className="onboarding-card__progress" aria-hidden="true">
                  {steps.map((item, index) => (
                    <span
                      key={item.title}
                      className={`onboarding-card__dot${index <= stepIndex ? ' onboarding-card__dot--active' : ''}${index < stepIndex ? ' onboarding-card__dot--done' : ''}`}
                    />
                  ))}
                </div>
              ) : null}

              {eyebrow ? <span className="onboarding-card__eyebrow">{eyebrow}</span> : null}

              <AnimatePresence mode="wait">
                <motion.div
                  key={step.title}
                  className="onboarding-card__content"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="onboarding-card__mascot-wrap">
                    <img
                      src={MASCOT_PATHS[step.mascot]}
                      alt=""
                      className="onboarding-card__mascot"
                      decoding="async"
                    />
                  </div>

                  <h2 id="onboarding-title" className="onboarding-card__title">
                    {step.title}
                  </h2>
                  <p className="onboarding-card__description">{step.description}</p>

                  {step.bullets?.length ? (
                    <ul className="onboarding-card__bullets">
                      {step.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="onboarding-card__footer">
              {steps.length > 1 ? (
                <span className="onboarding-card__counter">
                  Step {stepIndex + 1} of {steps.length}
                </span>
              ) : (
                <span className="onboarding-card__counter" aria-hidden="true" />
              )}

              <div className="onboarding-card__actions">
                {!isFirst && steps.length > 1 ? (
                  <Button type="button" variant="ghost" onClick={handleBack}>
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back
                  </Button>
                ) : null}
                <Button type="button" size="lg" onClick={handleNext} className="onboarding-card__next">
                  {isLast ? finishLabel : (
                    <>
                      Next
                      <ArrowRight size={16} aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

// Backwards-compatible export
export { InteractiveOnboarding as OnboardingFlow }
