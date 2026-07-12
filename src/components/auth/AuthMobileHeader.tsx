import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { COMPANY } from '../../lib/constants'

interface AuthMobileHeaderProps {
  eyebrow: string
  backTo?: string
  backLabel?: string
}

export function AuthMobileHeader({
  eyebrow,
  backTo = '/get-started',
  backLabel = 'Back',
}: AuthMobileHeaderProps) {
  return (
    <header className="auth-mobile-header">
      <div className="auth-mobile-header__top">
        <Link to={backTo} className="auth-mobile-header__back">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
        <Link to="/" className="auth-mobile-header__brand">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
          <span>{COMPANY.shortName}</span>
        </Link>
      </div>
      <p className="auth-mobile-header__eyebrow">{eyebrow}</p>
    </header>
  )
}
