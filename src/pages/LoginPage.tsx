import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { HOME_BY_ROLE } from '../auth/homeByRole'

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
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        <p className="muted">Plataforma de gestión de cursos</p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Email</span>
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
              placeholder="••••••••"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="button button--primary button--full" disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Sos estudiante y no tenés cuenta? <Link to="/register">Registrate</Link>
        </p>

        <p className="hint">
          Modo demo: el backend actual no expone autenticación. Se valida que el email pertenezca a una
          cuenta registrada; la contraseña no se verifica.
        </p>
      </div>
    </div>
  )
}
