import { useState, type FormEvent } from 'react'
import { assignInstructorSpecialty, createInstructor, getInstructors, removeInstructorSpecialty } from '../../api/instructors'
import { getSpecialties } from '../../api/specialties'
import { ErrorState, LoadingState } from '../../components/States'
import { useToast } from '../../components/useToast'
import type { Instructor } from '../../types/domain'
import { fullName, validateEmail } from '../../utils/labels'
import { useApiResource } from '../../utils/useApiResource'

interface FormState {
  firstName: string
  lastName: string
  email: string
  password: string
}

const EMPTY_FORM: FormState = { firstName: '', lastName: '', email: '', password: '' }

export function AdminInstructorsPage() {
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [assignmentInstructor, setAssignmentInstructor] = useState<Instructor | null>(null)

  const resource = useApiResource(async () => {
    const [instructors, specialties] = await Promise.all([getInstructors(), getSpecialties()])
    return { instructors, specialties }
  }, [])

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  const toggleSpecialty = (specialtyId: number) => {
    setSelectedSpecialties((current) =>
      current.includes(specialtyId)
        ? current.filter((id) => id !== specialtyId)
        : [...current, specialtyId],
    )
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
      const instructor = await createInstructor({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      if (selectedSpecialties.length > 0) {
        await Promise.all(
          selectedSpecialties.map((specialtyId) => assignInstructorSpecialty(instructor.id, specialtyId)),
        )
      }
      showToast('Instructor creado.')
      setForm(EMPTY_FORM)
      setSelectedSpecialties([])
      resource.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el instructor.')
    } finally {
      setBusy(false)
    }
  }

  const handleAssignment = async (instructor: Instructor, action: 'assign' | 'remove') => {
    const specialtyId = Number(assignments[instructor.id])
    if (!specialtyId) {
      showToast('Seleccioná una especialidad.', 'error')
      return
    }
    setAssignmentInstructor(instructor)
    try {
      if (action === 'assign') {
        await assignInstructorSpecialty(instructor.id, specialtyId)
        showToast('Especialidad asignada.')
      } else {
        await removeInstructorSpecialty(instructor.id, specialtyId)
        showToast('Especialidad quitada.')
      }
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : 'No se pudo actualizar la especialidad.', 'error')
    } finally {
      setAssignmentInstructor(null)
    }
  }

  if (resource.loading) {
    return <LoadingState message="Cargando instructores…" />
  }

  if (resource.error || !resource.data) {
    return <ErrorState message={resource.error ?? 'No se pudieron cargar los instructores.'} onRetry={resource.reload} />
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Instructores</h1>
          <p className="muted">Alta de instructores y asignación de especialidades.</p>
        </div>
      </header>

      <form className="panel form" onSubmit={handleCreate}>
        <h2>Dar de alta un instructor</h2>
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
            <span className="field__label">Correo electrónico</span>
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

        <fieldset className="field">
          <legend className="field__label">Especialidades</legend>
          <div className="checkbox-grid">
            {resource.data.specialties.map((specialty) => (
              <label key={specialty.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedSpecialties.includes(specialty.id)}
                  onChange={() => toggleSpecialty(specialty.id)}
                />
                {specialty.name}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <div className="actions">
          <button type="submit" className="button button--primary" disabled={busy}>
            {busy ? 'Creando…' : 'Crear instructor'}
          </button>
        </div>
      </form>

      <h2>Instructores registrados</h2>
      {resource.data.instructors.length === 0 ? (
        <p className="muted">No hay instructores registrados.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo electrónico</th>
                <th>Especialidades</th>
              </tr>
            </thead>
            <tbody>
              {resource.data.instructors.map((instructor) => (
                <tr key={instructor.id}>
                  <td>{fullName(instructor)}</td>
                  <td>{instructor.email}</td>
                  <td>
                    <div className="actions">
                      <select
                        value={assignments[instructor.id] ?? ''}
                        onChange={(event) =>
                          setAssignments((current) => ({ ...current, [instructor.id]: event.target.value }))
                        }
                        aria-label={`Especialidad para ${fullName(instructor)}`}
                      >
                        <option value="">Seleccionar…</option>
                        {resource.data?.specialties.map((specialty) => (
                          <option key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="button button--ghost button--small"
                        onClick={() => handleAssignment(instructor, 'assign')}
                        disabled={assignmentInstructor?.id === instructor.id}
                      >
                        Asignar
                      </button>
                      <button
                        type="button"
                        className="button button--ghost button--small"
                        onClick={() => handleAssignment(instructor, 'remove')}
                        disabled={assignmentInstructor?.id === instructor.id}
                      >
                        Quitar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint">
        El backend no expone las especialidades actuales de cada instructor; esta pantalla permite
        asignarlas y quitarlas, pero no puede mostrar cuáles tiene cargadas.
      </p>
    </section>
  )
}
