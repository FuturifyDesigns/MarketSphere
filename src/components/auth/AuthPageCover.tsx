import { useEffect, useState } from 'react'
import { isImagePreloaded, preloadImage } from '../../lib/imagePreload'

const base = import.meta.env.BASE_URL

type AuthCoverVariant = 'signin' | 'signup'

const COVER_PATH: Record<AuthCoverVariant, string> = {
  signin: 'auth/sign-in.webp',
  signup: 'auth/sign-up.webp',
}

interface AuthPageCoverProps {
  variant: AuthCoverVariant
}

export function AuthPageCover({ variant }: AuthPageCoverProps) {
  const path = COVER_PATH[variant]
  const src = `${base}${path}`
  const [ready, setReady] = useState(() => isImagePreloaded(path))

  useEffect(() => {
    if (ready) return
    void preloadImage(path).then(() => setReady(true))
  }, [path, ready])

  return (
    <div className={`auth-page__bg auth-page__bg--cover auth-page__bg--${variant}`} aria-hidden="true">
      <img
        className={`auth-page__cover-img${ready ? ' auth-page__cover-img--ready' : ''}`}
        src={src}
        alt=""
        fetchPriority="high"
        decoding="sync"
        loading="eager"
        draggable={false}
      />
      <div className="auth-page__cover-scrim" />
    </div>
  )
}
