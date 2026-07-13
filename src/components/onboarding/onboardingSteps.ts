import type { MascotKey } from '../../lib/mascots'

export type OnboardingPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'
export type ProviderOnboardingTab = 'profile' | 'services' | 'inbox'

export type OnboardingStep = {
  title: string
  description: string
  mascot: MascotKey
  bullets?: string[]
  target?: string
  placement?: OnboardingPlacement
  tab?: ProviderOnboardingTab
}

export const CUSTOMER_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Your enquiry tracker',
    mascot: 'explaining',
    target: 'customer-enquiries',
    placement: 'top',
    description: 'Every message you send to a provider appears here with live status updates.',
    bullets: [
      'Statuses move from new → read → replied → closed',
      'Providers are notified instantly when you enquire',
    ],
  },
  {
    title: 'Saved providers',
    mascot: 'explaining',
    target: 'customer-favorites',
    placement: 'top',
    description: 'Heart a provider on their profile and they will show up here for quick access.',
  },
  {
    title: 'Your profile',
    mascot: 'explaining',
    target: 'customer-profile',
    placement: 'right',
    description: 'Keep your name, email, and profile photo up to date so providers know who they are speaking with.',
  },
  {
    title: 'Find more providers',
    mascot: 'explaining',
    target: 'customer-browse',
    placement: 'bottom',
    description: 'Jump back to Browse any time to discover new professionals across Botswana.',
  },
  {
    title: 'You are all set!',
    mascot: 'allDone',
    placement: 'center',
    description: 'Start browsing, send your first enquiry, and track replies right from this dashboard.',
  },
]

export const PROVIDER_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Your provider hub',
    mascot: 'explaining',
    target: 'provider-hero',
    placement: 'bottom',
    description: 'This dashboard is your control centre for your public listing and customer messages.',
  },
  {
    title: 'Profile tab',
    mascot: 'explaining',
    target: 'provider-tab-profile',
    tab: 'profile',
    placement: 'right',
    description: 'Start on Profile to set up your business details, branding, and gallery.',
  },
  {
    title: 'Build your branding',
    mascot: 'explaining',
    target: 'provider-branding',
    tab: 'profile',
    placement: 'right',
    description: 'Upload a logo, cover image, and gallery photos so customers trust your listing immediately.',
  },
  {
    title: 'Services tab',
    mascot: 'explaining',
    target: 'provider-tab-services',
    tab: 'services',
    placement: 'right',
    description: 'Add the services you offer — we can auto-suggest a category from your business details.',
  },
  {
    title: 'Your services list',
    mascot: 'explaining',
    target: 'provider-services',
    tab: 'services',
    placement: 'right',
    description: 'List clear titles and descriptions so customers know exactly what you provide.',
  },
  {
    title: 'Inbox tab',
    mascot: 'explaining',
    target: 'provider-tab-inbox',
    tab: 'inbox',
    placement: 'right',
    description: 'All customer enquiries land here. You will also get real-time bell notifications.',
  },
  {
    title: 'Ready to grow!',
    mascot: 'allDone',
    placement: 'center',
    description: 'Complete your profile, publish your services, and start receiving customers on Market Sphere Group.',
  },
]
