import type { ReactNode } from 'react'

type IllustrationProps = {
  className?: string
}

function SvgFrame({ className = '', children }: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function YouthEmpowermentIllustration({ className = '' }: IllustrationProps) {
  return (
    <SvgFrame className={className}>
      <circle cx="200" cy="160" r="118" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <circle cx="200" cy="160" r="88" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <circle cx="152" cy="138" r="22" fill="currentColor" opacity="0.18" />
      <circle cx="248" cy="138" r="22" fill="currentColor" opacity="0.18" />
      <circle cx="200" cy="198" r="26" fill="currentColor" opacity="0.24" />
      <path d="M152 160c16 18 32 28 48 28s32-10 48-28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="svc-illus__draw" d="M118 210c28-42 52-58 82-58s54 16 82 58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path className="svc-illus__float" d="M92 118l18-10 10 18-18 10z" fill="currentColor" opacity="0.35" />
      <path className="svc-illus__float svc-illus__float--delay" d="M300 92l14-8 8 14-14 8z" fill="currentColor" opacity="0.28" />
    </SvgFrame>
  )
}

export function AcademicTuitionIllustration({ className = '' }: IllustrationProps) {
  return (
    <SvgFrame className={className}>
      <rect x="118" y="88" width="164" height="124" rx="14" stroke="currentColor" strokeWidth="2" opacity="0.45" />
      <path className="svc-illus__draw" d="M142 118h116M142 148h92M142 178h68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M200 88v-26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="200" cy="54" r="10" fill="currentColor" opacity="0.35" />
      <path className="svc-illus__float" d="M286 228l28 18-12 34-34-12z" fill="currentColor" opacity="0.22" />
      <path className="svc-illus__float svc-illus__float--delay" d="M98 226c0-18 12-30 28-30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </SvgFrame>
  )
}

export function PlatformMarketingIllustration({ className = '' }: IllustrationProps) {
  return (
    <SvgFrame className={className}>
      <rect x="96" y="102" width="88" height="148" rx="16" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <rect x="216" y="118" width="88" height="132" rx="16" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <circle className="svc-illus__pulse" cx="140" cy="138" r="8" fill="currentColor" opacity="0.4" />
      <path className="svc-illus__draw" d="M260 154h52M260 182h40M260 210h28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M188 176h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path className="svc-illus__float" d="M318 92c10 0 18 8 18 18s-8 18-18 18" stroke="currentColor" strokeWidth="2" />
      <path className="svc-illus__float svc-illus__float--delay" d="M72 196c-12 0-22 10-22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </SvgFrame>
  )
}

export function RealEstateIllustration({ className = '' }: IllustrationProps) {
  return (
    <SvgFrame className={className}>
      <path className="svc-illus__draw" d="M200 72 92 156v112h216V156z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="168" y="188" width="64" height="80" rx="6" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <path d="M128 156h144" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <circle className="svc-illus__float" cx="286" cy="118" r="12" fill="currentColor" opacity="0.2" />
      <path className="svc-illus__float svc-illus__float--delay" d="M118 228h44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </SvgFrame>
  )
}

export function EntrepreneurshipIllustration({ className = '' }: IllustrationProps) {
  return (
    <SvgFrame className={className}>
      <path className="svc-illus__draw" d="M96 228V156c0-36 46-66 104-66s104 30 104 66v72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M152 228h96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <path className="svc-illus__float" d="M200 118c-18 0-32 14-32 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path className="svc-illus__pulse" d="M200 86v20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path className="svc-illus__float svc-illus__float--delay" d="M286 98l18-10 10 18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M118 188c20 24 48 40 82 40s62-16 82-40" stroke="currentColor" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
    </SvgFrame>
  )
}

export const SERVICE_ILLUSTRATIONS = {
  'Youth Empowerment': YouthEmpowermentIllustration,
  'Academic Tuition': AcademicTuitionIllustration,
  'Platform Marketing': PlatformMarketingIllustration,
  'Real Estate Consultancy': RealEstateIllustration,
  'Entrepreneurship Development': EntrepreneurshipIllustration,
} as const
