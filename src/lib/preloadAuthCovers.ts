const AUTH_COVERS = ['auth/sign-in.png', 'auth/sign-up.png'] as const

let started = false

/** Warm the auth cover cache as early as possible. */
export function preloadAuthCovers() {
  if (started || typeof window === 'undefined') return
  started = true

  const base = import.meta.env.BASE_URL

  for (const path of AUTH_COVERS) {
    const href = `${base}${path}`

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = href
    document.head.appendChild(link)

    const img = new Image()
    img.decoding = 'async'
    img.src = href
  }
}
