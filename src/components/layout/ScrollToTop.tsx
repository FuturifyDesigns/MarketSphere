import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resetScrollOnRouteChange } from '../../lib/scrollToTop'
import { scheduleScrollRefresh } from '../../lib/scrollRefresh'

/** Scroll to top before paint on every route change (all pages, including auth). */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    resetScrollOnRouteChange()
    scheduleScrollRefresh()
  }, [pathname])

  return null
}
