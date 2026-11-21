import { Landscape } from '../components/CourseCover'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { HOME_BY_ROLE } from '../auth/homeByRole'
import { clearSessionExpired, wasSessionExpired } from '../auth/storage'
import { FormError } from '../components/FieldError'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Si la sesión anterior venció, se explica una vez y se borra la marca.
  const [sessionExpired] = useState(wasSessionExpired)

  useEffect(() => {
    clearSessionExpired()
  }, [])

  if (user) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const session = await login(email.trim(), password)
      const from = (location.state as LocationState | null)?.from
      navigate(from ?? HOME_BY_ROLE[session.user.role], { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art" aria-hidden="true">
        <Landscape seed={3} />
      </div>
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        <p className="muted">Plataforma de gestión de cursos</p>

        {sessionExpired && !error && (
          <p className="hint" role="status">
            Tu sesión venció. Ingresá de nuevo para continuar.
          </p>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field__label">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
            />
          </label>

          <label className="field">
            <span className="field__label">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <FormError>{error}</FormError>

          <button type="submit" className="button button--primary button--full" disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Sos estudiante y no tenés cuenta? <Link to="/register">Registrate</Link>
        </p>
      </div>
    </div>
  )
}
