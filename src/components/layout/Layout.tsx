import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useLenis } from '../../hooks/useLenis'

export function Layout() {
  useLenis()

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
