import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resetScrollOnRouteChange } from '../../lib/scrollToTop'
import { scheduleScrollRefresh } from '../../lib/scrollRefresh'

/** Scroll to top before paint on every route change (all pages, including auth). */
export function ScrollToTop() {
  const location = useLocation()

  useLayoutEffect(() => {
    resetScrollOnRouteChange()

    const isAuthRoute =
      location.pathname === '/get-started' || location.pathname === '/login' || location.pathname === '/register'
    if (!isAuthRoute) {
      scheduleScrollRefresh()
    }
  }, [location.pathname, location.key])

  return null
}
