import type { MascotKey } from '../../lib/mascots'

export type OnboardingStep = {
  title: string
  description: string
  mascot: MascotKey
  bullets?: string[]
}

export const WELCOME_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to Market Sphere Group',
    mascot: 'thumbsUp',
    description:
      'Your trusted marketplace for discovering verified service providers across Botswana — from tutors and consultants to youth mentors and real estate experts.',
    bullets: [
      'Browse providers by category and location',
      'Send secure enquiries straight from profiles',
      'Save favourites and track replies in your dashboard',
    ],
  },
]

export const CUSTOMER_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Your customer dashboard',
    mascot: 'explaining',
    description: 'This is your home base on Market Sphere Group. Everything you do as a customer is organised here.',
    bullets: [
      'See enquiry status from new to read, replied, or closed',
      'Update your profile photo and contact details anytime',
      'Jump back to Browse whenever you need a new provider',
    ],
  },
  {
    title: 'Find the right provider',
    mascot: 'explaining',
    description: 'Head to Browse to explore verified professionals across Botswana.',
    bullets: [
      'Filter by service category',
      'Open a profile to read services, gallery, and contact info',
      'Tap Send enquiry when you are ready to connect',
    ],
  },
  {
    title: 'Save providers you like',
    mascot: 'explaining',
    description: 'Found someone worth coming back to? Save them with one tap.',
    bullets: [
      'Use the heart on a provider profile to favourite them',
      'Revisit saved providers from your dashboard',
      'Enquire again without searching from scratch',
    ],
  },
  {
    title: 'You are all set!',
    mascot: 'allDone',
    description: 'Start exploring the marketplace and connect with professionals who fit your needs.',
    bullets: [
      'Notifications keep you updated on enquiry replies',
      'Your data is handled in line with Botswana privacy law',
    ],
  },
]

export const PROVIDER_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Your provider hub',
    mascot: 'explaining',
    description: 'Welcome to your business dashboard — manage your public listing and customer messages in one place.',
    bullets: [
      'Profile tab — business details, logo, cover, and gallery',
      'Services tab — what you offer and how customers find you',
      'Inbox tab — enquiries from customers on the platform',
    ],
  },
  {
    title: 'Build a standout profile',
    mascot: 'explaining',
    description: 'A complete profile helps customers trust you before they enquire.',
    bullets: [
      'Upload a logo and cover photo for your listing',
      'Write a clear description and location',
      'Add gallery images that showcase your work',
    ],
  },
  {
    title: 'List your services',
    mascot: 'explaining',
    description: 'Tell customers exactly what you offer with clear service entries.',
    bullets: [
      'Add titles and descriptions for each service',
      'We can auto-suggest a category from your business details',
      'Keep services updated as your offering grows',
    ],
  },
  {
    title: 'Never miss an enquiry',
    mascot: 'explaining',
    description: 'When a customer sends an enquiry, you will know right away.',
    bullets: [
      'Check the Inbox tab for new messages',
      'Bell notifications alert you in real time',
      'Mark enquiries read or replied as you respond',
    ],
  },
  {
    title: 'Ready to grow!',
    mascot: 'allDone',
    description: 'Complete your profile, publish your services, and start receiving customers on Market Sphere Group.',
    bullets: [
      'Verified listings help you stand out nationwide',
      'Customers discover you through Browse and categories',
    ],
  },
]
