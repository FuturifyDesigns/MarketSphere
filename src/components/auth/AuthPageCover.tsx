import { useEffect } from 'react'
import { preloadAuthCovers } from '../../lib/preloadAuthCovers'

const base = import.meta.env.BASE_URL

type AuthCoverVariant = 'signin' | 'signup'

const COVER_SRC: Record<AuthCoverVariant, string> = {
  signin: `${base}auth/sign-in.png`,
  signup: `${base}auth/sign-up.png`,
}

interface AuthPageCoverProps {
  variant: AuthCoverVariant
}

export function AuthPageCover({ variant }: AuthPageCoverProps) {
  useEffect(() => {
    preloadAuthCovers()
  }, [])

  return (
    <div className={`auth-page__bg auth-page__bg--cover auth-page__bg--${variant}`} aria-hidden="true">
      <img
        className="auth-page__cover-img"
        src={COVER_SRC[variant]}
        alt=""
        fetchPriority="high"
        decoding="sync"
        draggable={false}
      />
      <div className="auth-page__cover-scrim" />
    </div>
  )
}
