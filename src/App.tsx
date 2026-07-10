import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Services } from './pages/Services'
import { Contact } from './pages/Contact'
import { FAQ } from './pages/FAQ'
import { Browse } from './pages/Browse'
import { ProviderProfile } from './pages/ProviderProfile'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { CustomerDashboard } from './pages/dashboard/CustomerDashboard'
import { ProviderDashboard } from './pages/dashboard/ProviderDashboard'
import { AdminDashboard } from './pages/dashboard/AdminDashboard'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
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
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
