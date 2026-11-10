import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse, getCourses } from '../../api/courses'
import { getEnrollments, createEnrollment } from '../../api/enrollments'
import { getInstructors } from '../../api/instructors'
import { getSpecialties } from '../../api/specialties'
import { useAuth } from '../../auth/useAuth'
import { useToast } from '../../components/useToast'
import { CourseStatusBadge } from '../../components/StatusBadge'
import { ErrorState, LoadingState } from '../../components/States'
import { getEnrollmentEligibility } from '../../utils/enrollment'
import { formatCurrency, formatDate, isSameMonth, todayISO } from '../../utils/format'
import { fullName } from '../../utils/labels'
import { useApiResource } from '../../utils/useApiResource'

export function CourseDetailPage() {
  const { id } = useParams()
  const courseId = Number(id)
  const { user } = useAuth()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const resource = useApiResource(
    async () => {
      const [course, courses, specialties, instructors, enrollments] = await Promise.all([
        getCourse(courseId),
        getCourses(),
        getSpecialties(),
        getInstructors(),
        getEnrollments(),
      ])
      return { course, courses, specialties, instructors, enrollments }
    },
    [courseId],
  )

  const data = resource.data

  const specialty = useMemo(
    () => data?.specialties.find((item) => item.id === data.course.specialtyId) ?? null,
    [data],
  )
  const instructor = useMemo(
    () => data?.instructors.find((item) => item.id === data.course.instructorId) ?? null,
    [data],
  )
  const courseEnrollments = useMemo(
    () => (data?.enrollments ?? []).filter((enrollment) => enrollment.courseId === courseId),
    [data, courseId],
  )
  const myEnrollments = useMemo(
    () => (data?.enrollments ?? []).filter((enrollment) => enrollment.studentId === user?.id),
    [data, user],
  )
  const alreadyEnrolled = myEnrollments.some((enrollment) => enrollment.courseId === courseId)
  const eligibility = data
    ? getEnrollmentEligibility(data.course, courseEnrollments.length, alreadyEnrolled)
    : null

  const hasMonthlyDiscount =
    data !== null &&
    myEnrollments.some((enrollment) => {
      const previousCourse = data.courses.find((item) => item.id === enrollment.courseId)
      return (
        enrollment.courseId !== data.course.id &&
        previousCourse?.specialtyId === data.course.specialtyId &&
        isSameMonth(enrollment.enrollmentDate, todayISO())
      )
    })

  if (Number.isNaN(courseId)) {
    return <ErrorState message="El curso indicado no es válido." />
  }

  if (resource.loading) {
    return <LoadingState message="Cargando curso…" />
  }

  if (resource.error || !data || !eligibility) {
    return <ErrorState message={resource.error ?? 'No se pudo cargar el curso.'} onRetry={resource.reload} />
  }

  const course = data.course
  const spots = Math.max(course.maxCapacity - courseEnrollments.length, 0)

  const handleEnroll = async () => {
    if (!user) {
      return
    }
    setBusy(true)
    setActionError(null)
    try {
      const enrollment = await createEnrollment(user.id, course.id)
      showToast(`Inscripción confirmada. Precio final: ${formatCurrency(enrollment.finalAmount)}`)
      resource.reload()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo completar la inscripción.'
      setActionError(message)
      showToast(message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <p className="breadcrumb">
        <Link to="/student/catalog">← Volver al catálogo</Link>
      </p>

      <div className="detail-layout">
        <article className="panel">
          <div className="detail-title">
            <h1>{course.title}</h1>
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="muted">
            {specialty?.name ?? 'Sin especialidad'} · Instructor: {instructor ? fullName(instructor) : '—'}
          </p>

          <p className="description">{course.description || 'Sin descripción.'}</p>

          <dl className="detail-grid">
            <div>
              <dt>Inicio</dt>
              <dd>{formatDate(course.startDate)}</dd>
            </div>
            <div>
              <dt>Fin</dt>
              <dd>{formatDate(course.endDate)}</dd>
            </div>
            <div>
              <dt>Cupo máximo</dt>
              <dd>{course.maxCapacity}</dd>
            </div>
            <div>
              <dt>Cupos disponibles</dt>
              <dd>{spots}</dd>
            </div>
            <div>
              <dt>Inscriptos</dt>
              <dd>{courseEnrollments.length}</dd>
            </div>
            <div>
              <dt>Precio base</dt>
              <dd>{formatCurrency(course.basePrice)}</dd>
            </div>
          </dl>
        </article>

        <aside className="panel panel--sticky">
          <h2>Inscripción</h2>
          <p className="price">{formatCurrency(course.basePrice)}</p>
          <p className="muted">
            El backend calcula el precio final al confirmar (incluye el descuento de fidelidad del 25 % si
            corresponde).
          </p>

          {hasMonthlyDiscount && (
            <p className="hint">
              Ya tenés una inscripción este mes en la misma especialidad: podría aplicarse un 25 % de
              descuento.
            </p>
          )}

          {actionError && <p className="form-error">{actionError}</p>}

          <button
            type="button"
            className="button button--primary button--full"
            onClick={handleEnroll}
            disabled={!eligibility.canEnroll || busy}
          >
            {busy ? 'Inscribiendo…' : alreadyEnrolled ? 'Ya estás inscripto' : 'Inscribirme'}
          </button>

          {eligibility.reason && <p className="hint">{eligibility.reason}</p>}

          {alreadyEnrolled && (
            <p className="hint">
              Podés ver el precio final abonado en <Link to="/student/my-courses">Mis cursos</Link>.
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}
