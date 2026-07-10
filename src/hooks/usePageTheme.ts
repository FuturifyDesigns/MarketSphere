import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function usePageTheme() {
  const { pathname } = useLocation()

  useEffect(() => {
    const isHome = pathname === '/' || pathname === ''

    if (!isHome) {
      document.documentElement.style.setProperty('--sky-progress', '0')
      document.documentElement.setAttribute('data-theme', 'day')
    }
  }, [pathname])
}
