import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteCourse, getCourses } from '../../api/courses'
import { getSpecialties } from '../../api/specialties'
import { submitApprovalRequest } from '../../api/approvals'
import { useAuth } from '../../auth/useAuth'
import { CommentDialog, ConfirmDialog } from '../../components/ConfirmDialog'
import { CourseStatusBadge } from '../../components/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useToast } from '../../components/useToast'
import type { Course } from '../../types/domain'
import { formatCurrency, formatDate } from '../../utils/format'
import { useApiResource } from '../../utils/useApiResource'

export function InstructorCoursesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [approvalCourse, setApprovalCourse] = useState<Course | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [busy, setBusy] = useState(false)

  const resource = useApiResource(async () => {
    const [courses, specialties] = await Promise.all([getCourses(), getSpecialties()])
    return { courses, specialties }
  }, [])

  const specialtyMap = useMemo(
    () => new Map((resource.data?.specialties ?? []).map((item) => [item.id, item.name])),
    [resource.data],
  )

  const myCourses = useMemo(() => {
    const instructorId = user?.id ?? -1
    return (resource.data?.courses ?? [])
      .filter((course) => course.instructorId === instructorId)
      .sort((first, second) => second.startDate.localeCompare(first.startDate))
  }, [resource.data, user])

  const handleRequestApproval = async (comment: string) => {
    if (!approvalCourse) {
      return
    }
    setBusy(true)
    try {
      await submitApprovalRequest(approvalCourse.id, comment)
      showToast('Solicitud de aprobación enviada.')
      setApprovalCourse(null)
      resource.reload()
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : 'No se pudo enviar la solicitud.', 'error')
    } finally {
      setBusy(false)
    }
  }

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
    return <LoadingState message="Cargando tus cursos…" />
  }

  if (resource.error) {
    return <ErrorState message={resource.error} onRetry={resource.reload} />
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Mis cursos</h1>
          <p className="muted">Solo podés editar o eliminar cursos en borrador.</p>
        </div>
        <Link className="button button--primary" to="/instructor/courses/new">
          Crear curso
        </Link>
      </header>

      {myCourses.length === 0 ? (
        <EmptyState message="No tenés cursos todavía." hint="Creá tu primer curso para comenzar." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Especialidad</th>
                <th>Fechas</th>
                <th className="cell-number">Cupo</th>
                <th className="cell-number">Precio base</th>
                <th>Estado</th>
                <th className="cell-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {myCourses.map((course) => (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{specialtyMap.get(course.specialtyId ?? 0) ?? '—'}</td>
                  <td>
                    {formatDate(course.startDate)} – {formatDate(course.endDate)}
                  </td>
                  <td className="cell-number">{course.maxCapacity}</td>
                  <td className="cell-number">{formatCurrency(course.basePrice)}</td>
                  <td>
                    <CourseStatusBadge status={course.status} />
                  </td>
                  <td>
                    <div className="actions">
                      <Link
                        className="button button--ghost button--small"
                        to={`/instructor/courses/${course.id}/students`}
                      >
                        Ver inscriptos
                      </Link>
                      {course.status === 'DRAFT' && (
                        <>
                          <Link
                            className="button button--ghost button--small"
                            to={`/instructor/courses/${course.id}/edit`}
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            className="button button--ghost button--small"
                            onClick={() => setApprovalCourse(course)}
                          >
                            Solicitar aprobación
                          </button>
                          <button
                            type="button"
                            className="button button--danger-quiet button--small"
                            onClick={() => setCourseToDelete(course)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approvalCourse && (
        <CommentDialog
          title={`Solicitar aprobación: ${approvalCourse.title}`}
          label="Comentario para el administrador (opcional)"
          confirmLabel="Enviar solicitud"
          busy={busy}
          onConfirm={handleRequestApproval}
          onCancel={() => setApprovalCourse(null)}
        />
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
