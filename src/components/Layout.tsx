import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ROLE_LABELS, fullName } from '../utils/labels'
import type { Role } from '../types/domain'

interface NavItem {
  to: string
  label: string
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STUDENT: [
    { to: '/student/catalog', label: 'Catálogo' },
    { to: '/student/my-courses', label: 'Mis cursos' },
  ],
  INSTRUCTOR: [
    { to: '/instructor/courses', label: 'Mis cursos' },
    { to: '/instructor/requests', label: 'Mis solicitudes' },
    { to: '/instructor/revenue', label: 'Recaudación' },
  ],
  ADMIN: [
    { to: '/admin/requests', label: 'Solicitudes' },
    { to: '/admin/courses', label: 'Cursos' },
    { to: '/admin/instructors', label: 'Instructores' },
    { to: '/admin/administrators', label: 'Administradores' },
    { to: '/admin/revenue', label: 'Recaudación' },
  ],
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar__inner">
          <NavLink to="/" className="brand">
            Edu<span>Platform</span>
          </NavLink>

          {user && (
            <nav className="navbar__nav" aria-label="Navegación principal">
              {NAV_BY_ROLE[user.role].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {user && (
            <div className="navbar__user">
              <span className="navbar__identity">
                {fullName(user)}
                <small>{ROLE_LABELS[user.role]}</small>
              </span>
              <button type="button" className="button button--ghost button--small" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}
