import { Landscape } from '../components/CourseCover'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { createStudent } from '../api/students'
import { useAuth } from '../auth/useAuth'
import { HOME_BY_ROLE } from '../auth/homeByRole'
import { FieldError, FormError } from '../components/FieldError'
import { validateEmail } from '../utils/labels'
import { useFormErrors, type FieldErrors } from '../utils/useFormErrors'

interface FormState {
  firstName: string
  lastName: string
  dni: string
  email: string
  password: string
}

type Field = keyof FormState

const INITIAL_STATE: FormState = {
  firstName: '',
  lastName: '',
  dni: '',
  email: '',
  password: '',
}

// Mismo orden que en pantalla y mismos nombres que StudentRequest del backend.
const FIELDS: readonly Field[] = ['firstName', 'lastName', 'dni', 'email', 'password']

function validate(form: FormState): FieldErrors<Field> {
  const errors: FieldErrors<Field> = {}
  if (!form.firstName.trim()) {
    errors.firstName = 'Ingresá tu nombre.'
  }
  if (!form.lastName.trim()) {
    errors.lastName = 'Ingresá tu apellido.'
  }
  if (!/^\d{7,8}$/.test(form.dni.trim())) {
    errors.dni = 'El DNI debe tener 7 u 8 dígitos, sin puntos.'
  }
  if (!validateEmail(form.email.trim())) {
    errors.email = 'Ingresá un email válido, por ejemplo nombre@dominio.com.'
  }
  if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  }
  return errors
}

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [busy, setBusy] = useState(false)
  const errors = useFormErrors('register', FIELDS)

  const updateField = (field: Field, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    errors.clearField(field)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (errors.showValidation(validate(form))) {
      return
    }

    setBusy(true)
    errors.reset()
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
      if (cause instanceof ApiError && cause.status === 409) {
        // El backend no dice si se repite el email o el DNI: se ofrece la salida más probable.
        errors.setFormError(
          <>
            Ya hay una cuenta con ese email o ese DNI. Si es tuya, <Link to="/login">iniciá sesión</Link>.
          </>,
        )
      } else {
        errors.showApiError(cause, 'No se pudo completar el registro.')
      }
    } finally {
      setBusy(false)
    }
  }

  const { fieldErrors, fieldId, inputProps } = errors

  return (
    <div className="auth-page">
      <div className="auth-art" aria-hidden="true">
        <Landscape seed={1} />
      </div>
      <div className="auth-card">
        <h1>Registro de estudiante</h1>
        <p className="muted">Creá tu cuenta para inscribirte a los cursos.</p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                {...inputProps('firstName')}
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                required
                autoComplete="given-name"
              />
              <FieldError fieldId={fieldId('firstName')} message={fieldErrors.firstName} />
            </label>
            <label className="field">
              <span className="field__label">Apellido</span>
              <input
                {...inputProps('lastName')}
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                required
                autoComplete="family-name"
              />
              <FieldError fieldId={fieldId('lastName')} message={fieldErrors.lastName} />
            </label>
          </div>

          <label className="field">
            <span className="field__label">DNI</span>
            <input
              {...inputProps('dni')}
              inputMode="numeric"
              value={form.dni}
              onChange={(event) => updateField('dni', event.target.value)}
              required
              placeholder="12345678"
            />
            <FieldError fieldId={fieldId('dni')} message={fieldErrors.dni} />
          </label>

          <label className="field">
            <span className="field__label">Correo electrónico</span>
            <input
              {...inputProps('email')}
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
              autoComplete="email"
            />
            <FieldError fieldId={fieldId('email')} message={fieldErrors.email} />
          </label>

          <label className="field">
            <span className="field__label">Contraseña</span>
            <input
              {...inputProps('password')}
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
            <FieldError fieldId={fieldId('password')} message={fieldErrors.password} />
          </label>

          <FormError>{errors.summary}</FormError>

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
