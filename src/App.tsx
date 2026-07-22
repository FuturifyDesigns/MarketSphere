import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CookieConsentProvider } from './context/CookieConsentContext'
import { NotificationProvider } from './context/NotificationContext'
import { SiteContentProvider } from './context/SiteContentContext'
import { SiteEditProvider } from './context/SiteEditContext'
import { CmsTextEditorProvider } from './context/CmsTextEditorContext'
import { ToastProvider } from './context/ToastContext'
import { isIntroComplete, onIntroComplete } from './lib/intro'
import { preloadServiceVideos } from './lib/serviceVideoCache'
import { preloadAllImages } from './lib/imagePreload'
import { preloadCriticalAssets } from './lib/preloadCriticalAssets'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { SiteIntro } from './components/intro/SiteIntro'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
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
import { NotFound } from './pages/NotFound'
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'
import { CookieBanner } from './components/legal/CookieBanner'

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
        <CookieConsentProvider>
          <SiteContentProvider>
            <HashRouter>
              <SiteEditProvider>
                <CmsTextEditorProvider>
                <SiteIntro />
                <ScrollToTop />
                <CookieBanner />
                <NotificationProvider>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route
                        index
                        element={
                          <ErrorBoundary label="home">
                            <Home />
                          </ErrorBoundary>
                        }
                      />
                      <Route path="about" element={<About />} />
                      <Route path="services" element={<Services />} />
                      <Route path="contact" element={<Contact />} />
                      <Route path="faq" element={<FAQ />} />
                      <Route path="privacy" element={<Privacy />} />
                      <Route path="terms" element={<Terms />} />
                      <Route
                        path="browse"
                        element={
                          <ErrorBoundary label="browse">
                            <Browse />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="provider/:id"
                        element={
                          <ErrorBoundary label="provider">
                            <ProviderProfile />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="dashboard/customer"
                        element={
                          <ProtectedRoute allowedRoles={['customer']}>
                            <ErrorBoundary label="customer-dashboard">
                              <CustomerDashboard />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="dashboard/provider"
                        element={
                          <ProtectedRoute allowedRoles={['provider']}>
                            <ErrorBoundary label="provider-dashboard">
                              <ProviderDashboard />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="dashboard/admin"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <ErrorBoundary label="admin-dashboard">
                              <AdminDashboard />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                    <Route path="get-started" element={<AuthGate />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="auth/verify" element={<VerifyEmail />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="auth/reset-password" element={<ResetPassword />} />
                  </Routes>
                </NotificationProvider>
                </CmsTextEditorProvider>
              </SiteEditProvider>
            </HashRouter>
          </SiteContentProvider>
        </CookieConsentProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
