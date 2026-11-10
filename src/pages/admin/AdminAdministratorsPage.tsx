import { useState, type FormEvent } from 'react'
import { createAdministrator, getAdministrators } from '../../api/administrators'
import { ErrorState, LoadingState } from '../../components/States'
import { useToast } from '../../components/useToast'
import { fullName, validateEmail } from '../../utils/labels'
import { useApiResource } from '../../utils/useApiResource'

interface FormState {
  firstName: string
  lastName: string
  email: string
  password: string
}

const EMPTY_FORM: FormState = { firstName: '', lastName: '', email: '', password: '' }

export function AdminAdministratorsPage() {
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const resource = useApiResource(() => getAdministrators(), [])

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Ingresá nombre y apellido.')
      return
    }
    if (!validateEmail(form.email.trim())) {
      setError('Ingresá un email válido.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await createAdministrator({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      showToast('Administrador creado.')
      setForm(EMPTY_FORM)
      resource.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el administrador.')
    } finally {
      setBusy(false)
    }
  }

  if (resource.loading) {
    return <LoadingState message="Cargando administradores…" />
  }

  if (resource.error) {
    return <ErrorState message={resource.error} onRetry={resource.reload} />
  }

  const administrators = resource.data ?? []

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Administradores</h1>
          <p className="muted">Alta de otros administradores de la plataforma.</p>
        </div>
      </header>

      <form className="panel form" onSubmit={handleCreate}>
        <h2>Dar de alta un administrador</h2>
        <div className="form-row">
          <label className="field">
            <span className="field__label">Nombre</span>
            <input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} required />
          </label>
          <label className="field">
            <span className="field__label">Apellido</span>
            <input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} required />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Contraseña</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              required
              minLength={6}
            />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="actions">
          <button type="submit" className="button button--primary" disabled={busy}>
            {busy ? 'Creando…' : 'Crear administrador'}
          </button>
        </div>
      </form>

      <h2>Administradores registrados</h2>
      {administrators.length === 0 ? (
        <p className="muted">No hay administradores registrados.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {administrators.map((administrator) => (
                <tr key={administrator.id}>
                  <td>{fullName(administrator)}</td>
                  <td>{administrator.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
