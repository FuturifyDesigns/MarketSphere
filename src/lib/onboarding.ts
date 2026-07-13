export const ONBOARDING_STORAGE = {
  welcome: 'marketsphere-welcome-seen',
  customer: 'marketsphere-customer-onboarding-seen',
  provider: 'marketsphere-provider-onboarding-seen',
} as const

export type OnboardingRole = 'customer' | 'provider'

function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
}

export function hasSeenWelcome() {
  return readFlag(ONBOARDING_STORAGE.welcome)
}

export function markWelcomeSeen() {
  writeFlag(ONBOARDING_STORAGE.welcome)
}

export function hasSeenRoleOnboarding(role: OnboardingRole) {
  const key = role === 'customer' ? ONBOARDING_STORAGE.customer : ONBOARDING_STORAGE.provider
  return readFlag(key)
}

export function markRoleOnboardingSeen(role: OnboardingRole) {
  const key = role === 'customer' ? ONBOARDING_STORAGE.customer : ONBOARDING_STORAGE.provider
  writeFlag(key)
}
