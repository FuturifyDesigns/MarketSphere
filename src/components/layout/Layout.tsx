import { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { PageTransition } from './PageTransition'
import { useLenis } from '../../hooks/useLenis'
import { usePageTheme } from '../../hooks/usePageTheme'
import { resetIntroActiveClass } from '../../lib/intro'

export function Layout() {
  useLenis()
  usePageTheme()

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    document.documentElement.classList.add('lenis')
    document.documentElement.setAttribute('data-theme', 'day')
    resetIntroActiveClass()
    return () => document.documentElement.classList.remove('lenis')
  }, [])

  return (
    <div className="layout">
      <Navbar />
      <main className="main">
        <PageTransition />
      </main>
      <Footer />
    </div>
  )
}
