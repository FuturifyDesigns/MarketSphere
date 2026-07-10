import { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { PageTransition } from './PageTransition'
import { useLenis } from '../../hooks/useLenis'
import { usePageTheme } from '../../hooks/usePageTheme'

export function Layout() {
  useLenis()
  usePageTheme()

  useEffect(() => {
    document.documentElement.classList.add('lenis')
    document.documentElement.setAttribute('data-theme', 'day')
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
