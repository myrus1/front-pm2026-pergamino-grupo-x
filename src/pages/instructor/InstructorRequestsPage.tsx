import { useMemo } from 'react'
import { getApprovalRequests } from '../../api/approvals'
import { getCourses } from '../../api/courses'
import { useAuth } from '../../auth/useAuth'
import { ApprovalStatusBadge } from '../../components/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { formatDateTime } from '../../utils/format'
import { useApiResource } from '../../utils/useApiResource'

export function InstructorRequestsPage() {
  const { user } = useAuth()

  const resource = useApiResource(async () => {
    const [requests, courses] = await Promise.all([
      getApprovalRequests({ instructorId: user?.id }),
      getCourses(),
    ])
    return { requests, courses }
  }, [user?.id])

  const courseMap = useMemo(
    () => new Map((resource.data?.courses ?? []).map((course) => [course.id, course])),
    [resource.data],
  )

  if (resource.loading) {
    return <LoadingState message="Cargando solicitudes…" />
  }

  if (resource.error) {
    return <ErrorState message={resource.error} onRetry={resource.reload} />
  }

  const requests = resource.data?.requests ?? []

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Mis solicitudes</h1>
          <p className="muted">Historial de solicitudes de aprobación de tus cursos.</p>
        </div>
      </header>

      {requests.length === 0 ? (
        <EmptyState message="No enviaste solicitudes de aprobación todavía." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Fecha de solicitud</th>
                <th>Fecha de resolución</th>
                <th>Estado</th>
                <th>Mi comentario</th>
                <th>Comentario del administrador</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{courseMap.get(request.courseId)?.title ?? `Curso #${request.courseId}`}</td>
                  <td>{formatDateTime(request.requestDate)}</td>
                  <td>{formatDateTime(request.resolutionDate)}</td>
                  <td>
                    <ApprovalStatusBadge status={request.status} />
                  </td>
                  <td>{request.instructorComment || '—'}</td>
                  <td>{request.administratorComment || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
