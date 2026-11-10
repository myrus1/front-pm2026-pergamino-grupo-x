import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { HOME_BY_ROLE } from '../auth/homeByRole'

export function UnauthorizedPage() {
  const { user } = useAuth()

  return (
    <div className="center-page">
      <h1>No autorizado</h1>
      <p className="muted">No tenés permisos para acceder a esta sección.</p>
      <Link className="button button--primary" to={user ? HOME_BY_ROLE[user.role] : '/login'}>
        Volver al inicio
      </Link>
    </div>
  )
}

export function NotFoundPage() {
  const { user } = useAuth()

  return (
    <div className="center-page">
      <h1>Página no encontrada</h1>
      <p className="muted">La dirección que ingresaste no existe.</p>
      <Link className="button button--primary" to={user ? HOME_BY_ROLE[user.role] : '/login'}>
        Volver al inicio
      </Link>
    </div>
  )
}
