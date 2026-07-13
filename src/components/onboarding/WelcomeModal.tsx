import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isIntroComplete, onIntroComplete } from '../../lib/intro'
import { hasSeenWelcome, markWelcomeSeen } from '../../lib/onboarding'
import { OnboardingFlow } from './OnboardingFlow'
import { WELCOME_STEPS } from './onboardingSteps'

const WELCOME_DELAY_MS = 500

export function WelcomeModal() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (hasSeenWelcome()) return

    const reveal = () => {
      if (!hasSeenWelcome()) setOpen(true)
    }

    if (isIntroComplete()) {
      const timer = window.setTimeout(reveal, WELCOME_DELAY_MS)
      return () => window.clearTimeout(timer)
    }

    return onIntroComplete(() => {
      window.setTimeout(reveal, WELCOME_DELAY_MS)
    })
  }, [])

  const closeWelcome = () => {
    markWelcomeSeen()
    setOpen(false)
  }

  const handleComplete = () => {
    closeWelcome()
    navigate('/browse')
  }

  return (
    <OnboardingFlow
      open={open}
      steps={WELCOME_STEPS}
      eyebrow="First visit"
      onComplete={handleComplete}
      onDismiss={closeWelcome}
      finishLabel="Explore providers"
      showSkip
    />
  )
}
