import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createStudent } from '../api/students'
import { useAuth } from '../auth/useAuth'
import { HOME_BY_ROLE } from '../auth/homeByRole'
import { validateEmail } from '../utils/labels'

interface FormState {
  firstName: string
  lastName: string
  dni: string
  email: string
  password: string
}

const INITIAL_STATE: FormState = {
  firstName: '',
  lastName: '',
  dni: '',
  email: '',
  password: '',
}

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  const validate = (): string | null => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return 'Ingresá nombre y apellido.'
    }
    if (!/^\d{7,8}$/.test(form.dni.trim())) {
      return 'El DNI debe tener 7 u 8 dígitos.'
    }
    if (!validateEmail(form.email.trim())) {
      return 'Ingresá un email válido.'
    }
    if (form.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await createStudent({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dni: form.dni.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      const session = await login(form.email.trim(), form.password)
      navigate(HOME_BY_ROLE[session.user.role], { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar el registro.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Registro de estudiante</h1>
        <p className="muted">Creá tu cuenta para inscribirte a los cursos.</p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                required
                autoComplete="given-name"
              />
            </label>
            <label className="field">
              <span className="field__label">Apellido</span>
              <input
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                required
                autoComplete="family-name"
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">DNI</span>
            <input
              inputMode="numeric"
              value={form.dni}
              onChange={(event) => updateField('dni', event.target.value)}
              required
              placeholder="12345678"
            />
          </label>

          <label className="field">
            <span className="field__label">Correo electrónico</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span className="field__label">Contraseña</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="button button--primary button--full" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
