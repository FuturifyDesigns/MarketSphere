import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { isIntroComplete, onIntroComplete } from './lib/intro'
import { preloadServiceVideos } from './lib/serviceVideoCache'
import { preloadAllImages } from './lib/imagePreload'
import { preloadCriticalAssets } from './lib/preloadCriticalAssets'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { SiteIntro } from './components/intro/SiteIntro'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Services } from './pages/Services'
import { Contact } from './pages/Contact'
import { FAQ } from './pages/FAQ'
import { Browse } from './pages/Browse'
import { ProviderProfile } from './pages/ProviderProfile'
import { AuthGate } from './pages/AuthGate'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyEmail } from './pages/VerifyEmail'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { CustomerDashboard } from './pages/dashboard/CustomerDashboard'
import { ProviderDashboard } from './pages/dashboard/ProviderDashboard'
import { AdminDashboard } from './pages/dashboard/AdminDashboard'

export default function App() {
  useEffect(() => {
    preloadCriticalAssets()
    preloadAllImages()
  }, [])

  useEffect(() => {
    let idleId: number | undefined
    let timeoutId: number | undefined
    let cancelled = false

    const startPreload = () => {
      if (cancelled) return
      const run = () => {
        if (!cancelled) void preloadServiceVideos()
      }
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(run, { timeout: 4000 })
      } else {
        timeoutId = window.setTimeout(run, 2000)
      }
    }

    let removeIntro: (() => void) | undefined
    if (isIntroComplete()) {
      startPreload()
    } else {
      removeIntro = onIntroComplete(startPreload)
    }

    return () => {
      cancelled = true
      removeIntro?.()
      if (idleId !== undefined) window.cancelIdleCallback(idleId)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <AuthProvider>
      <ToastProvider>
      <SiteIntro />
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="browse" element={<Browse />} />
            <Route path="provider/:id" element={<ProviderProfile />} />
            <Route
              path="dashboard/customer"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard/provider"
              element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="get-started" element={<AuthGate />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="auth/verify" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="auth/reset-password" element={<ResetPassword />} />
        </Routes>
      </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
