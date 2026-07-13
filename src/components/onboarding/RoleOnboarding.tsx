import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { hasSeenRoleOnboarding, markRoleOnboardingSeen, type OnboardingRole } from '../../lib/onboarding'
import { InteractiveOnboarding } from './InteractiveOnboarding'
import { CUSTOMER_ONBOARDING_STEPS, PROVIDER_ONBOARDING_STEPS, type OnboardingStep } from './onboardingSteps'

type RoleOnboardingProps = {
  role: OnboardingRole
  onStepEnter?: (step: OnboardingStep, index: number) => void
}

export type RoleOnboardingHandle = {
  replay: () => void
}

const STEPS_BY_ROLE = {
  customer: CUSTOMER_ONBOARDING_STEPS,
  provider: PROVIDER_ONBOARDING_STEPS,
} as const

const EYEBROW_BY_ROLE = {
  customer: 'Customer onboarding',
  provider: 'Provider onboarding',
} as const

const FINISH_LABEL_BY_ROLE = {
  customer: 'Start browsing',
  provider: 'Finish tour',
} as const

export const RoleOnboarding = forwardRef<RoleOnboardingHandle, RoleOnboardingProps>(
  function RoleOnboarding({ role, onStepEnter }, ref) {
    const [open, setOpen] = useState(false)
    const [tourKey, setTourKey] = useState(0)

    useImperativeHandle(
      ref,
      () => ({
        replay: () => {
          setTourKey((current) => current + 1)
          setOpen(true)
        },
      }),
      [],
    )

    useEffect(() => {
      if (hasSeenRoleOnboarding(role)) return

      const timer = window.setTimeout(() => {
        if (!hasSeenRoleOnboarding(role)) setOpen(true)
      }, 700)

      return () => window.clearTimeout(timer)
    }, [role])

    const handleClose = () => {
      markRoleOnboardingSeen(role)
      setOpen(false)
    }

    return (
      <InteractiveOnboarding
        key={tourKey}
        open={open}
        steps={STEPS_BY_ROLE[role]}
        eyebrow={EYEBROW_BY_ROLE[role]}
        onComplete={handleClose}
        onDismiss={handleClose}
        onStepEnter={onStepEnter}
        finishLabel={FINISH_LABEL_BY_ROLE[role]}
        showSkip
      />
    )
  },
)
