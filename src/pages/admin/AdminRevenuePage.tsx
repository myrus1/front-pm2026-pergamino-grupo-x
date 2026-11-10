import { getEnrollments, getEnrollmentRevenue } from '../../api/enrollments'
import { ErrorState, LoadingState } from '../../components/States'
import { formatCurrency } from '../../utils/format'
import { useApiResource } from '../../utils/useApiResource'

export function AdminRevenuePage() {
  const resource = useApiResource(async () => {
    const [revenue, enrollments] = await Promise.all([getEnrollmentRevenue(), getEnrollments()])
    return { total: revenue.total, count: enrollments.length }
  }, [])

  if (resource.loading) {
    return <LoadingState message="Cargando recaudación…" />
  }

  if (resource.error || !resource.data) {
    return <ErrorState message={resource.error ?? 'No se pudo cargar la recaudación.'} onRetry={resource.reload} />
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Recaudación global</h1>
          <p className="muted">Monto total recaudado por la plataforma.</p>
        </div>
      </header>

      <div className="summary">
        <div className="summary__item">
          <span className="summary__label">Total recaudado</span>
          <strong className="summary__value">{formatCurrency(resource.data.total)}</strong>
          <span className="summary__hint">Monto informado por el backend.</span>
        </div>
        <div className="summary__item">
          <span className="summary__label">Inscripciones</span>
          <strong className="summary__value">{resource.data.count}</strong>
          <span className="summary__hint">Inscripciones registradas en la plataforma.</span>
        </div>
      </div>

      <p className="hint">
        El total se obtiene de <code>GET /enrollments/revenue</code>; la cantidad de inscripciones se
        calcula con el listado de inscripciones.
      </p>
    </section>
  )
}
