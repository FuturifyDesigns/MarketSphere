import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { MASCOT_PATHS } from '../../lib/mascots'
import { Button } from '../ui/Button'
import type { OnboardingStep } from './onboardingSteps'
import './Onboarding.css'

type OnboardingFlowProps = {
  open: boolean
  steps: OnboardingStep[]
  eyebrow?: string
  onComplete: () => void
  onDismiss?: () => void
  finishLabel?: string
  showSkip?: boolean
}

export function OnboardingFlow({
  open,
  steps,
  eyebrow,
  onComplete,
  onDismiss,
  finishLabel = 'Get started',
  showSkip = true,
}: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]
  const isLast = stepIndex >= steps.length - 1
  const isFirst = stepIndex === 0

  const dismiss = onDismiss ?? onComplete

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

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
          className="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="presentation"
        >
          <motion.div
            className="onboarding-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            {showSkip ? (
              <button type="button" className="onboarding-card__skip" onClick={handleSkip}>
                Skip
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
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
