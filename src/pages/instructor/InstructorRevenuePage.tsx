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

  const totalEnrollments = breakdown.reduce((sum, item) => sum + item.count, 0)

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

      <div className="summary">
        <div className="summary__item">
          <span className="summary__label">Total recaudado</span>
          <strong className="summary__value">{formatCurrency(resource.data.revenue.total)}</strong>
          <span className="summary__hint">Valor informado por el backend.</span>
        </div>
        <div className="summary__item">
          <span className="summary__label">Cursos</span>
          <strong className="summary__value">{breakdown.length}</strong>
          <span className="summary__hint">Cursos con recaudación estimada.</span>
        </div>
        <div className="summary__item">
          <span className="summary__label">Inscriptos</span>
          <strong className="summary__value">{totalEnrollments}</strong>
          <span className="summary__hint">Inscripciones en tus cursos.</span>
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
                <th className="cell-number">Inscriptos</th>
                <th className="cell-number">Recaudación estimada</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item) => (
                <tr key={item.course.id}>
                  <td>{item.course.title}</td>
                  <td className="cell-number">{item.count}</td>
                  <td className="cell-number">{formatCurrency(item.estimated)}</td>
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
