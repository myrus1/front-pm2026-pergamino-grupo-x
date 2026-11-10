import { useMemo, useState } from 'react'
import { approveApprovalRequest, getApprovalRequests, rejectApprovalRequest } from '../../api/approvals'
import { getCourses } from '../../api/courses'
import { getInstructors } from '../../api/instructors'
import { getSpecialties } from '../../api/specialties'
import { useAuth } from '../../auth/useAuth'
import { CommentDialog } from '../../components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useToast } from '../../components/useToast'
import type { ApprovalRequest } from '../../types/domain'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format'
import { fullName } from '../../utils/labels'
import { useApiResource } from '../../utils/useApiResource'

type Resolution = 'approve' | 'reject'

export function AdminApprovalsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<{ request: ApprovalRequest; mode: Resolution } | null>(null)
  const [busy, setBusy] = useState(false)

  const resource = useApiResource(async () => {
    const [requests, courses, specialties, instructors] = await Promise.all([
      getApprovalRequests({ status: 'SUBMITTED' }),
      getCourses(),
      getSpecialties(),
      getInstructors(),
    ])
    return { requests, courses, specialties, instructors }
  }, [])

  const courseMap = useMemo(
    () => new Map((resource.data?.courses ?? []).map((course) => [course.id, course])),
    [resource.data],
  )
  const specialtyMap = useMemo(
    () => new Map((resource.data?.specialties ?? []).map((item) => [item.id, item.name])),
    [resource.data],
  )
  const instructorMap = useMemo(
    () => new Map((resource.data?.instructors ?? []).map((item) => [item.id, fullName(item)])),
    [resource.data],
  )

  const handleResolve = async (comment: string) => {
    if (!selected || !user) {
      return
    }
    setBusy(true)
    try {
      if (selected.mode === 'approve') {
        await approveApprovalRequest(selected.request.id, user.id, comment)
        showToast('Solicitud aprobada: el curso quedó publicado.')
      } else {
        await rejectApprovalRequest(selected.request.id, user.id, comment)
        showToast('Solicitud rechazada: el curso volvió a borrador.')
      }
      setSelected(null)
      resource.reload()
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : 'No se pudo resolver la solicitud.', 'error')
    } finally {
      setBusy(false)
    }
  }

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
          <h1>Solicitudes pendientes</h1>
          <p className="muted">Aprobá o rechazá las solicitudes de publicación de cursos.</p>
        </div>
      </header>

      {requests.length === 0 ? (
        <EmptyState message="No hay solicitudes pendientes." />
      ) : (
        <div className="stack">
          {requests.map((request) => {
            const course = courseMap.get(request.courseId)
            return (
              <article key={request.id} className="panel">
                <header className="panel__header">
                  <div>
                    <h2>{course?.title ?? `Curso #${request.courseId}`}</h2>
                    <p className="muted">
                      Solicitud enviada el {formatDateTime(request.requestDate)}
                    </p>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="button button--primary button--small"
                      onClick={() => setSelected({ request, mode: 'approve' })}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="button button--danger button--small"
                      onClick={() => setSelected({ request, mode: 'reject' })}
                    >
                      Rechazar
                    </button>
                  </div>
                </header>

                {course && (
                  <dl className="detail-grid">
                    <div>
                      <dt>Especialidad</dt>
                      <dd>{specialtyMap.get(course.specialtyId ?? 0) ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Instructor</dt>
                      <dd>{instructorMap.get(course.instructorId ?? 0) ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Fechas</dt>
                      <dd>
                        {formatDate(course.startDate)} – {formatDate(course.endDate)}
                      </dd>
                    </div>
                    <div>
                      <dt>Cupo</dt>
                      <dd>{course.maxCapacity}</dd>
                    </div>
                    <div>
                      <dt>Precio base</dt>
                      <dd>{formatCurrency(course.basePrice)}</dd>
                    </div>
                  </dl>
                )}

                {course?.description && <p className="description">{course.description}</p>}

                <p className="muted">
                  Comentario del instructor: {request.instructorComment || 'Sin comentario.'}
                </p>
              </article>
            )
          })}
        </div>
      )}

      {selected && (
        <CommentDialog
          title={selected.mode === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
          label={
            selected.mode === 'approve'
              ? 'Comentario (opcional)'
              : 'Motivo del rechazo (obligatorio)'
          }
          required={selected.mode === 'reject'}
          danger={selected.mode === 'reject'}
          confirmLabel={selected.mode === 'approve' ? 'Aprobar' : 'Rechazar'}
          busy={busy}
          onConfirm={handleResolve}
          onCancel={() => setSelected(null)}
        />
      )}
    </section>
  )
}
