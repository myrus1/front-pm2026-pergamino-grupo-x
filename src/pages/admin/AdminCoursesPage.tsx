import { useMemo, useState } from 'react'
import { deleteCourse, getCourses } from '../../api/courses'
import { getInstructors } from '../../api/instructors'
import { getSpecialties } from '../../api/specialties'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { CourseStatusBadge } from '../../components/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useToast } from '../../components/useToast'
import type { Course, CourseStatus } from '../../types/domain'
import { formatCurrency, formatDate } from '../../utils/format'
import { COURSE_STATUS_LABELS, fullName } from '../../utils/labels'
import { useApiResource } from '../../utils/useApiResource'

export function AdminCoursesPage() {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<CourseStatus | ''>('')
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [busy, setBusy] = useState(false)

  const resource = useApiResource(async () => {
    const [courses, specialties, instructors] = await Promise.all([
      getCourses(),
      getSpecialties(),
      getInstructors(),
    ])
    return { courses, specialties, instructors }
  }, [])

  const specialtyMap = useMemo(
    () => new Map((resource.data?.specialties ?? []).map((item) => [item.id, item.name])),
    [resource.data],
  )
  const instructorMap = useMemo(
    () => new Map((resource.data?.instructors ?? []).map((item) => [item.id, fullName(item)])),
    [resource.data],
  )

  const courses = useMemo(() => {
    const all = resource.data?.courses ?? []
    return all
      .filter((course) => (statusFilter ? course.status === statusFilter : true))
      .sort((first, second) => second.startDate.localeCompare(first.startDate))
  }, [resource.data, statusFilter])

  const handleDelete = async () => {
    if (!courseToDelete) {
      return
    }
    setBusy(true)
    try {
      await deleteCourse(courseToDelete.id)
      showToast('Curso eliminado.')
      setCourseToDelete(null)
      resource.reload()
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : 'No se pudo eliminar el curso.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (resource.loading) {
    return <LoadingState message="Cargando cursos…" />
  }

  if (resource.error) {
    return <ErrorState message={resource.error} onRetry={resource.reload} />
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Cursos</h1>
          <p className="muted">Listado global de cursos de la plataforma.</p>
        </div>
        <label className="field field--inline">
          <span className="field__label">Filtrar por estado</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as CourseStatus | '')}
          >
            <option value="">Todos</option>
            {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map((status) => (
              <option key={status} value={status}>
                {COURSE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      </header>

      {courses.length === 0 ? (
        <EmptyState message="No hay cursos para los filtros seleccionados." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Especialidad</th>
                <th>Instructor</th>
                <th>Fechas</th>
                <th className="cell-number">Precio base</th>
                <th>Estado</th>
                <th className="cell-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{specialtyMap.get(course.specialtyId ?? 0) ?? '—'}</td>
                  <td>{instructorMap.get(course.instructorId ?? 0) ?? '—'}</td>
                  <td>
                    {formatDate(course.startDate)} – {formatDate(course.endDate)}
                  </td>
                  <td className="cell-number">{formatCurrency(course.basePrice)}</td>
                  <td>
                    <CourseStatusBadge status={course.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button button--danger-quiet button--small"
                      onClick={() => setCourseToDelete(course)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {courseToDelete && (
        <ConfirmDialog
          title="Eliminar curso"
          message={`¿Seguro que querés eliminar "${courseToDelete.title}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setCourseToDelete(null)}
        />
      )}
    </section>
  )
}
