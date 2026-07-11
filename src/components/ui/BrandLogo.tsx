import { LOGO_ALT, LOGO_SRC } from '../../lib/brand'

type BrandLogoProps = {
  className?: string
  alt?: string
}

export function BrandLogo({ className = '', alt = LOGO_ALT }: BrandLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={`brand-logo ${className}`.trim()}
      decoding="async"
    />
  )
}
