import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { MASCOT_PATHS } from '../../lib/mascots'
import { scrollTourAfterLayout } from '../../lib/tourScroll'
import { Button } from '../ui/Button'
import type { OnboardingPlacement, OnboardingStep } from './onboardingSteps'
import './Onboarding.css'

const SPOTLIGHT_PADDING = 10
const TOOLTIP_GAP = 16
const TOOLTIP_MARGIN = 16
const OVERLAP_GAP = 12

type Box = {
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

function measureTarget(targetId: string | undefined): Box | null {
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

function boxesOverlap(a: Box, b: Box, gap = OVERLAP_GAP): boolean {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  )
}

function clampBox(top: number, left: number, width: number, height: number): Box {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  return {
    top: Math.max(TOOLTIP_MARGIN, Math.min(top, viewportHeight - height - TOOLTIP_MARGIN)),
    left: Math.max(TOOLTIP_MARGIN, Math.min(left, viewportWidth - width - TOOLTIP_MARGIN)),
    width,
    height,
  }
}

function positionForPlacement(spotlight: Box, placement: OnboardingPlacement, cardWidth: number, cardHeight: number) {
  switch (placement) {
    case 'top':
      return {
        top: spotlight.top - cardHeight - TOOLTIP_GAP,
        left: spotlight.left + spotlight.width / 2 - cardWidth / 2,
      }
    case 'left':
      return {
        top: spotlight.top + spotlight.height / 2 - cardHeight / 2,
        left: spotlight.left - cardWidth - TOOLTIP_GAP,
      }
    case 'right':
      return {
        top: spotlight.top + spotlight.height / 2 - cardHeight / 2,
        left: spotlight.left + spotlight.width + TOOLTIP_GAP,
      }
    case 'bottom':
    default:
      return {
        top: spotlight.top + spotlight.height + TOOLTIP_GAP,
        left: spotlight.left + spotlight.width / 2 - cardWidth / 2,
      }
  }
}

function fallbackPositions(cardWidth: number, cardHeight: number): Array<{ top: number; left: number }> {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = TOOLTIP_MARGIN

  return [
    { top: margin, left: viewportWidth - cardWidth - margin },
    { top: margin, left: margin },
    { top: viewportHeight - cardHeight - margin, left: margin },
    { top: viewportHeight - cardHeight - margin, left: viewportWidth - cardWidth - margin },
    {
      top: (viewportHeight - cardHeight) / 2,
      left: (viewportWidth - cardWidth) / 2,
    },
  ]
}

function scorePlacement(
  spotlight: Box,
  placement: OnboardingPlacement,
  preferred: OnboardingPlacement,
  cardWidth: number,
  cardHeight: number,
): { box: Box; score: number } | null {
  const raw = positionForPlacement(spotlight, placement, cardWidth, cardHeight)
  const box = clampBox(raw.top, raw.left, cardWidth, cardHeight)
  const shifted = Math.abs(box.top - raw.top) + Math.abs(box.left - raw.left)

  if (boxesOverlap(box, spotlight)) return null

  let score = 1000 - shifted
  if (placement === preferred) score += 120

  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  if (box.top <= TOOLTIP_MARGIN + 2) score += 40
  if (box.left + box.width >= viewportWidth - TOOLTIP_MARGIN - 2) score += 20
  if (box.top + box.height <= viewportHeight - TOOLTIP_MARGIN - 2) score += 80

  return { box, score }
}

function isMobileViewport() {
  return window.innerWidth <= 640
}

function getTooltipPosition(
  spotlight: Box | null,
  preferredPlacement: OnboardingPlacement | undefined,
  cardWidth: number,
  cardHeight: number,
): CSSProperties {
  if (!spotlight) {
    return {}
  }

  const mobile = isMobileViewport()
  const preferred = preferredPlacement ?? 'bottom'
  const candidates: OnboardingPlacement[] = mobile
    ? [preferred === 'left' || preferred === 'right' ? 'bottom' : preferred, 'top', 'bottom']
    : [preferred, 'right', 'left', 'bottom', 'top']

  let best: { box: Box; score: number } | null = null
  for (const placement of candidates) {
    const result = scorePlacement(spotlight, placement, preferred, cardWidth, cardHeight)
    if (!result) continue
    if (!best || result.score > best.score) best = result
  }

  if (!best) {
    for (const raw of fallbackPositions(cardWidth, cardHeight)) {
      const box = clampBox(raw.top, raw.left, cardWidth, cardHeight)
      if (!boxesOverlap(box, spotlight)) {
        best = { box, score: 0 }
        break
      }
    }
  }

  if (!best) {
    const box = clampBox(
      (window.innerHeight - cardHeight) / 2,
      (window.innerWidth - cardWidth) / 2,
      cardWidth,
      cardHeight,
    )
    best = { box, score: 0 }
  }

  if (mobile) {
    return {
      position: 'fixed',
      top: best.box.top,
      left: TOOLTIP_MARGIN,
      right: TOOLTIP_MARGIN,
      width: 'auto',
      maxHeight: `min(72dvh, ${window.innerHeight - best.box.top - TOOLTIP_MARGIN}px)`,
    }
  }

  return {
    position: 'fixed',
    top: best.box.top,
    left: best.box.left,
    width: cardWidth,
    maxHeight: `min(68dvh, ${window.innerHeight - best.box.top - TOOLTIP_MARGIN}px)`,
  }
}

function scrollTargetForTooltip(
  element: HTMLElement,
  placement: OnboardingPlacement | undefined,
  cardHeight: number,
  cardWidth: number,
  centered: boolean,
) {
  scrollTourAfterLayout(element, {
    centered,
    cardHeight,
    cardWidth,
    placement: placement ?? 'right',
  })
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [spotlight, setSpotlight] = useState<Box | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({})
  const step = steps[stepIndex]
  const isLast = stepIndex >= steps.length - 1
  const isFirst = stepIndex === 0
  const dismiss = onDismiss ?? onComplete
  const centered = step ? isCenterStep(step) : true

  const refreshSpotlight = useCallback(() => {
    const cardHeight = cardRef.current?.offsetHeight || 420
    const cardWidth = Math.min(
      cardRef.current?.offsetWidth || Math.min(400, window.innerWidth - TOOLTIP_MARGIN * 2),
      window.innerWidth - TOOLTIP_MARGIN * 2,
    )

    if (!step || isCenterStep(step)) {
      setSpotlight(null)
      setTooltipStyle({})
      return
    }

    const rect = measureTarget(step.target)
    setSpotlight(rect)
    setTooltipStyle(getTooltipPosition(rect, step.placement, cardWidth, cardHeight))
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

    const centeredStep = isCenterStep(step)
    const element = step.target
      ? document.querySelector<HTMLElement>(`[data-onboarding="${step.target}"]`)
      : null

    const cardHeight = cardRef.current?.offsetHeight || 420
    const cardWidth = Math.min(
      cardRef.current?.offsetWidth || Math.min(400, window.innerWidth - TOOLTIP_MARGIN * 2),
      window.innerWidth - TOOLTIP_MARGIN * 2,
    )

    const layoutDelay = step.tab ? 200 : centeredStep ? 0 : 60

    const runScrollAndMeasure = () => {
      if (centeredStep) {
        scrollTourAfterLayout(null, { centered: true }, refreshSpotlight)
      } else if (element) {
        scrollTargetForTooltip(element, step.placement, cardHeight, cardWidth, false)
      }
      refreshSpotlight()
    }

    const startTimer = window.setTimeout(runScrollAndMeasure, layoutDelay)
    const timers = [layoutDelay + 120, layoutDelay + 320, layoutDelay + 620, layoutDelay + 950].map((delay) =>
      window.setTimeout(refreshSpotlight, delay),
    )

    const onLayoutChange = () => refreshSpotlight()
    window.addEventListener('resize', onLayoutChange)
    window.addEventListener('scroll', onLayoutChange, true)

    let targetObserver: ResizeObserver | undefined
    let cardObserver: ResizeObserver | undefined

    if (typeof ResizeObserver !== 'undefined') {
      if (element) {
        targetObserver = new ResizeObserver(onLayoutChange)
        targetObserver.observe(element)
      }
      if (cardRef.current) {
        cardObserver = new ResizeObserver(onLayoutChange)
        cardObserver.observe(cardRef.current)
      }
    }

    return () => {
      window.clearTimeout(startTimer)
      timers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('resize', onLayoutChange)
      window.removeEventListener('scroll', onLayoutChange, true)
      targetObserver?.disconnect()
      cardObserver?.disconnect()
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

  const renderCardBody = () => (
    <>
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
    </>
  )

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

          {centered ? (
            <div className="onboarding-card-stage onboarding-card-stage--centered">
              <motion.div
                ref={cardRef}
                className="onboarding-card onboarding-card--centered"
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-title"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderCardBody()}
              </motion.div>
            </div>
          ) : (
            <motion.div
              ref={cardRef}
              className="onboarding-card onboarding-card--docked"
              style={tooltipStyle}
              role="dialog"
              aria-modal="true"
              aria-labelledby="onboarding-title"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderCardBody()}
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

// Backwards-compatible export
export { InteractiveOnboarding as OnboardingFlow }
