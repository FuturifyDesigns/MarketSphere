import { useEffect, useState } from 'react'
import { hasSeenRoleOnboarding, markRoleOnboardingSeen, type OnboardingRole } from '../../lib/onboarding'
import { OnboardingFlow } from './OnboardingFlow'
import { CUSTOMER_ONBOARDING_STEPS, PROVIDER_ONBOARDING_STEPS } from './onboardingSteps'

type RoleOnboardingProps = {
  role: OnboardingRole
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
  provider: 'Open my dashboard',
} as const

export function RoleOnboarding({ role }: RoleOnboardingProps) {
  const [open, setOpen] = useState(false)

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
    <OnboardingFlow
      open={open}
      steps={STEPS_BY_ROLE[role]}
      eyebrow={EYEBROW_BY_ROLE[role]}
      onComplete={handleClose}
      onDismiss={handleClose}
      finishLabel={FINISH_LABEL_BY_ROLE[role]}
      showSkip
    />
  )
}
