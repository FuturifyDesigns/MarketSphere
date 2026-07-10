import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useLenis } from '../../hooks/useLenis'

export function Layout() {
  useLenis()

  useEffect(() => {
    document.documentElement.classList.add('lenis')
    return () => document.documentElement.classList.remove('lenis')
  }, [])

  return (
    <div className="layout">
      <Navbar />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
