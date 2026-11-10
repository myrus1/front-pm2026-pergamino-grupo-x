import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '../types/domain'
import { useAuth } from './useAuth'

interface ProtectedRouteProps {
  roles?: Role[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
