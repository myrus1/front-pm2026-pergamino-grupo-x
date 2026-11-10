import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCourse, getCourse, updateCourse } from '../../api/courses'
import { getSpecialties } from '../../api/specialties'
import { useAuth } from '../../auth/useAuth'
import { useToast } from '../../components/useToast'
import { CourseStatusBadge } from '../../components/StatusBadge'
import { ErrorState, LoadingState } from '../../components/States'
import type { CoursePayload, Specialty } from '../../types/domain'
import { useApiResource } from '../../utils/useApiResource'

interface FormState {
  title: string
  description: string
  startDate: string
  endDate: string
  maxCapacity: string
  basePrice: string
  specialtyId: string
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  maxCapacity: '',
  basePrice: '',
  specialtyId: '',
}

function validate(form: FormState): string | null {
  if (!form.title.trim()) {
    return 'El título es obligatorio.'
  }
  if (!form.startDate || !form.endDate) {
    return 'Completá las fechas de inicio y fin.'
  }
  if (form.endDate <= form.startDate) {
    return 'La fecha de fin debe ser posterior a la de inicio.'
  }
  const capacity = Number(form.maxCapacity)
  if (!Number.isInteger(capacity) || capacity <= 0) {
    return 'El cupo debe ser un número entero mayor a cero.'
  }
  const price = Number(form.basePrice)
  if (!Number.isFinite(price) || price <= 0) {
    return 'El precio base debe ser mayor a cero.'
  }
  if (!form.specialtyId) {
    return 'Seleccioná una especialidad.'
  }
  return null
}

interface CourseFormProps {
  specialties: Specialty[]
  initial?: {
    id: number
    form: FormState
  }
}

function CourseForm({ specialties, initial }: CourseFormProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(initial?.form ?? EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }
    if (!user) {
      return
    }

    const payload: CoursePayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      basePrice: Number(form.basePrice),
      startDate: form.startDate,
      endDate: form.endDate,
      maxCapacity: Number(form.maxCapacity),
      specialtyId: Number(form.specialtyId),
      instructorId: user.id,
    }

    setBusy(true)
    setError(null)
    try {
      if (initial) {
        await updateCourse(initial.id, payload)
        showToast('Curso actualizado.')
      } else {
        await createCourse(payload)
        showToast('Curso creado en borrador.')
      }
      navigate('/instructor/courses')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el curso.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Título</span>
        <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
      </label>

      <label className="field">
        <span className="field__label">Descripción</span>
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
        />
      </label>

      <div className="form-row">
        <label className="field">
          <span className="field__label">Fecha de inicio</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => updateField('startDate', event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Fecha de fin</span>
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => updateField('endDate', event.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field__label">Cupo máximo</span>
          <input
            type="number"
            min={1}
            value={form.maxCapacity}
            onChange={(event) => updateField('maxCapacity', event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Precio base (ARS)</span>
          <input
            type="number"
            min={1}
            step="0.01"
            value={form.basePrice}
            onChange={(event) => updateField('basePrice', event.target.value)}
            required
          />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Especialidad</span>
        <select
          value={form.specialtyId}
          onChange={(event) => updateField('specialtyId', event.target.value)}
          required
        >
          <option value="">Seleccioná una especialidad</option>
          {specialties.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {specialty.name}
            </option>
          ))}
        </select>
      </label>
      <p className="hint">
        El backend valida que la especialidad esté asignada al instructor; si no lo está, mostrará el
        error al guardar.
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="actions">
        <Link className="button button--ghost" to="/instructor/courses">
          Cancelar
        </Link>
        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear curso'}
        </button>
      </div>
    </form>
  )
}

export function CourseFormPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const courseId = id ? Number(id) : null

  const resource = useApiResource(async () => {
    const [specialties, course] = await Promise.all([
      getSpecialties(),
      courseId ? getCourse(courseId) : Promise.resolve(null),
    ])
    return { specialties, course }
  }, [courseId])

  if (resource.loading) {
    return <LoadingState message="Cargando formulario…" />
  }

  if (resource.error || !resource.data) {
    return <ErrorState message={resource.error ?? 'No se pudo cargar el formulario.'} onRetry={resource.reload} />
  }

  const { specialties, course } = resource.data

  if (courseId && !course) {
    return <ErrorState message="El curso no existe." />
  }

  const isOwner = course ? course.instructorId === user?.id : true

  if (course && !isOwner) {
    return <ErrorState message="No podés editar un curso de otro instructor." />
  }

  if (course && course.status !== 'DRAFT') {
    return (
      <section>
        <header className="page-header">
          <h1>Editar curso</h1>
        </header>
        <div className="alert alert--warning">
          Solo se pueden editar cursos en borrador. Estado actual: <CourseStatusBadge status={course.status} />
        </div>
        <p>
          <Link className="button button--ghost" to="/instructor/courses">
            Volver a mis cursos
          </Link>
        </p>
      </section>
    )
  }

  const initial = course
    ? {
        id: course.id,
        form: {
          title: course.title,
          description: course.description ?? '',
          startDate: course.startDate,
          endDate: course.endDate,
          maxCapacity: String(course.maxCapacity),
          basePrice: String(course.basePrice),
          specialtyId: course.specialtyId ? String(course.specialtyId) : '',
        },
      }
    : undefined

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>{course ? 'Editar curso' : 'Nuevo curso'}</h1>
          <p className="muted">Los cursos nuevos se crean en estado borrador.</p>
        </div>
      </header>
      <CourseForm key={course?.id ?? 'new'} specialties={specialties} initial={initial} />
    </section>
  )
}
