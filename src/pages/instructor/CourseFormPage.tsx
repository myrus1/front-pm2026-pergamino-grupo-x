import { CourseCover } from '../../components/CourseCover'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCourse, getCourse, updateCourse } from '../../api/courses'
import { getSpecialties } from '../../api/specialties'
import { useAuth } from '../../auth/useAuth'
import { FieldError, FormError } from '../../components/FieldError'
import { useToast } from '../../components/useToast'
import { CourseStatusBadge } from '../../components/StatusBadge'
import { ErrorState, LoadingState } from '../../components/States'
import type { CoursePayload, Specialty } from '../../types/domain'
import { useApiResource } from '../../utils/useApiResource'
import { useFormErrors, type FieldErrors } from '../../utils/useFormErrors'

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

type Field = keyof FormState

// Mismo orden que en pantalla y mismos nombres que CourseRequest del backend.
const FIELDS: readonly Field[] = [
  'title',
  'description',
  'startDate',
  'endDate',
  'maxCapacity',
  'basePrice',
  'specialtyId',
]

function validate(form: FormState): FieldErrors<Field> {
  const errors: FieldErrors<Field> = {}
  if (!form.title.trim()) {
    errors.title = 'Ingresá el título del curso.'
  }
  if (!form.startDate) {
    errors.startDate = 'Elegí la fecha de inicio.'
  }
  if (!form.endDate) {
    errors.endDate = 'Elegí la fecha de fin.'
  } else if (form.startDate && form.endDate <= form.startDate) {
    errors.endDate = 'Tiene que ser posterior a la fecha de inicio.'
  }
  const capacity = Number(form.maxCapacity)
  if (!form.maxCapacity || !Number.isInteger(capacity) || capacity <= 0) {
    errors.maxCapacity = 'El cupo debe ser un número entero mayor a cero.'
  }
  const price = Number(form.basePrice)
  if (!form.basePrice || !Number.isFinite(price) || price <= 0) {
    errors.basePrice = 'El precio base debe ser mayor a cero.'
  }
  if (!form.specialtyId) {
    errors.specialtyId = 'Seleccioná una especialidad.'
  }
  return errors
}

interface CourseFormProps {
  specialties: Specialty[]
  initial?: {
    id: number
    form: FormState
  }
}

// Mientras el curso no existe, la portada de prueba sale del título.
function titleSeed(title: string): number {
  let hash = 0
  for (const char of title) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return Math.abs(hash)
}

function CourseForm({ specialties, initial }: CourseFormProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(initial?.form ?? EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const errors = useFormErrors('course', FIELDS)
  const { fieldErrors, fieldId, inputProps } = errors

  const updateField = (field: Field, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    errors.clearField(field)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (errors.showValidation(validate(form))) {
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
    errors.reset()
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
      errors.showApiError(cause, 'No se pudo guardar el curso.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="form-layout">
    <form className="panel form form--narrow" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="field__label">Título</span>
        <input
          {...inputProps('title')}
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          required
        />
        <FieldError fieldId={fieldId('title')} message={fieldErrors.title} />
      </label>

      <label className="field">
        <span className="field__label">Descripción</span>
        <textarea
          {...inputProps('description')}
          rows={4}
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
        />
        <FieldError fieldId={fieldId('description')} message={fieldErrors.description} />
      </label>

      <div className="form-row">
        <label className="field">
          <span className="field__label">Fecha de inicio</span>
          <input
            {...inputProps('startDate')}
            type="date"
            value={form.startDate}
            onChange={(event) => updateField('startDate', event.target.value)}
            required
          />
          <FieldError fieldId={fieldId('startDate')} message={fieldErrors.startDate} />
        </label>
        <label className="field">
          <span className="field__label">Fecha de fin</span>
          <input
            {...inputProps('endDate')}
            type="date"
            value={form.endDate}
            onChange={(event) => updateField('endDate', event.target.value)}
            required
          />
          <FieldError fieldId={fieldId('endDate')} message={fieldErrors.endDate} />
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field__label">Cupo máximo</span>
          <input
            {...inputProps('maxCapacity')}
            type="number"
            min={1}
            value={form.maxCapacity}
            onChange={(event) => updateField('maxCapacity', event.target.value)}
            required
          />
          <FieldError fieldId={fieldId('maxCapacity')} message={fieldErrors.maxCapacity} />
        </label>
        <label className="field">
          <span className="field__label">Precio base (ARS)</span>
          <input
            {...inputProps('basePrice')}
            type="number"
            min={1}
            step="0.01"
            value={form.basePrice}
            onChange={(event) => updateField('basePrice', event.target.value)}
            required
          />
          <FieldError fieldId={fieldId('basePrice')} message={fieldErrors.basePrice} />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Especialidad</span>
        <select
          {...inputProps('specialtyId')}
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
        <FieldError fieldId={fieldId('specialtyId')} message={fieldErrors.specialtyId} />
      </label>
      <p className="hint">
        El backend valida que la especialidad esté asignada al instructor; si no lo está, mostrará el
        error al guardar.
      </p>

      <FormError>{errors.summary}</FormError>

      <div className="actions">
        <Link className="button button--ghost" to="/instructor/courses">
          Cancelar
        </Link>
        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear curso'}
        </button>
      </div>
    </form>
      <aside className="form-preview" aria-label="Vista previa de la portada">
        <CourseCover
          variant="book"
          seed={initial?.id ?? titleSeed(form.title)}
          title={form.title.trim() || 'Título del curso'}
          kicker={specialties.find((item) => String(item.id) === form.specialtyId)?.name ?? 'Especialidad'}
        />
        {!initial && <p className="muted">La portada definitiva se genera cuando se crea el curso.</p>}
      </aside>
    </div>
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
