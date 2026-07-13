type MarketIconProps = {
  size?: number
  className?: string
}

export function MarketIconLive({ size = 20, className }: MarketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
      <path
        d="M8.4 8.4a5.6 5.6 0 0 0 0 7.2M15.6 8.4a5.6 5.6 0 0 1 0 7.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M5.8 5.8a9.2 9.2 0 0 0 0 12.4M18.2 5.8a9.2 9.2 0 0 1 0 12.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MarketIconCategories({ size = 20, className }: MarketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="7" height="7" rx="1.75" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="4" width="7" height="7" rx="1.75" stroke="currentColor" strokeWidth="1.75" />
      <rect x="4" y="13" width="7" height="7" rx="1.75" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M16.5 13h3.5v3.5M16.5 16.5H20M16.5 20H20V16.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MarketIconVerifiedTrust({ size = 20, className }: MarketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 3.5 5.5 6.2v5.3c0 4.1 2.8 7.9 6.5 8.9 3.7-1 6.5-4.8 6.5-8.9V6.2L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12.1 1.8 1.8 3.8-3.9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MarketIconExplore({ size = 16, className }: MarketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="15.5" cy="10" r="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 17.5c1.4-2.4 3.6-3.8 6.2-3.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M14.5 15.5 18.5 18.5M18 15.5l.5 3 3 .5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MarketIconVerified({ size = 20, className }: MarketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9 12.2 10.8 14l4.2-4.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4.5 6.8 6.7c-.9.4-1.3 1.4-1.3 2.5v3.1c0 3.2 2.2 6.2 5.1 7 2.9-.8 5.1-3.8 5.1-7V9.2c0-1.1-.4-2.1-1.3-2.5L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MarketIconNetwork({ size = 20, className }: MarketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9.6 10.4 10.8 14.2M14.4 14.2l1.2-3.8M10.2 9.8h3.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function MarketIconServices({ size = 20, className }: MarketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 7V5.8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2V7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

export function MarketIconGallery({ size = 20, className }: MarketIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path
        d="m6.5 17 4.2-4.2 2.4 2.4L14.5 12 18.5 17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
