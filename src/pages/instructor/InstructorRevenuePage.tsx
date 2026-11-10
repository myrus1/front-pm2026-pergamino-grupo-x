import { useMemo } from 'react'
import { getCourses } from '../../api/courses'
import { getEnrollments } from '../../api/enrollments'
import { getInstructorRevenue } from '../../api/instructors'
import { useAuth } from '../../auth/useAuth'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { formatCurrency } from '../../utils/format'
import { useApiResource } from '../../utils/useApiResource'

const INSTRUCTOR_SHARE = 0.65

export function InstructorRevenuePage() {
  const { user } = useAuth()

  const resource = useApiResource(async () => {
    if (!user) {
      return null
    }
    const [revenue, courses, enrollments] = await Promise.all([
      getInstructorRevenue(user.id),
      getCourses(),
      getEnrollments(),
    ])
    return { revenue, courses, enrollments }
  }, [user?.id])

  const breakdown = useMemo(() => {
    const data = resource.data
    if (!data || !user) {
      return []
    }
    return data.courses
      .filter((course) => course.instructorId === user.id)
      .map((course) => {
        const count = data.enrollments.filter((enrollment) => enrollment.courseId === course.id).length
        return {
          course,
          count,
          estimated: Math.round(Number(course.basePrice) * INSTRUCTOR_SHARE * count * 100) / 100,
        }
      })
      .sort((first, second) => second.estimated - first.estimated)
  }, [resource.data, user])

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
          <h1>Recaudación</h1>
          <p className="muted">El 65 % del precio base de cada inscripción en tus cursos.</p>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">Total recaudado</span>
          <strong className="stat-card__value">{formatCurrency(resource.data.revenue.total)}</strong>
          <span className="muted">Valor informado por el backend.</span>
        </div>
      </div>

      <h2>Desglose por curso</h2>
      {breakdown.length === 0 ? (
        <EmptyState message="No tenés cursos todavía." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Inscriptos</th>
                <th>Recaudación estimada</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item) => (
                <tr key={item.course.id}>
                  <td>{item.course.title}</td>
                  <td>{item.count}</td>
                  <td>{formatCurrency(item.estimated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint">
        El desglose se calcula en el front con la fórmula 65 % × precio base × inscriptos. El total
        oficial es el que devuelve el backend.
      </p>
    </section>
  )
}
