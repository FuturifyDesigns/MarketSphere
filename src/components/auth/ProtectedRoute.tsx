import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../lib/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    const redirect =
      profile.role === 'admin'
        ? '/dashboard/admin'
        : profile.role === 'provider'
          ? '/dashboard/provider'
          : '/dashboard/customer'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
