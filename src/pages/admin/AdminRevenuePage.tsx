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

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">Total recaudado</span>
          <strong className="stat-card__value">{formatCurrency(resource.data.total)}</strong>
          <span className="muted">{resource.data.count} inscripciones registradas.</span>
        </div>
      </div>

      <p className="hint">
        El total se obtiene de <code>GET /enrollments/revenue</code>; la cantidad de inscripciones se
        calcula con el listado de inscripciones.
      </p>
    </section>
  )
}
