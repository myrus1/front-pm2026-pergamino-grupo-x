import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../../api/courses'
import { getEnrollments } from '../../api/enrollments'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useAuth } from '../../auth/useAuth'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { useApiResource } from '../../utils/useApiResource'

export function MyCoursesPage() {
  const { user } = useAuth()

  const resource = useApiResource(
    async () => {
      const [enrollments, courses] = await Promise.all([getEnrollments(), getCourses()])
      return { enrollments, courses }
    },
    [],
  )

  const courseMap = useMemo(
    () => new Map((resource.data?.courses ?? []).map((course) => [course.id, course])),
    [resource.data],
  )

  const myEnrollments = useMemo(() => {
    const studentId = user?.id ?? -1
    return (resource.data?.enrollments ?? [])
      .filter((enrollment) => enrollment.studentId === studentId)
      .sort((first, second) => second.enrollmentDate.localeCompare(first.enrollmentDate))
  }, [resource.data, user])

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
          <p className="muted">Inscripciones ordenadas de la más reciente a la más antigua.</p>
        </div>
      </header>

      {myEnrollments.length === 0 ? (
        <EmptyState
          message="Todavía no te inscribiste a ningún curso."
          hint="Explorá el catálogo para encontrar cursos publicados."
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Fecha de inscripción</th>
                <th className="cell-number">Precio final abonado</th>
              </tr>
            </thead>
            <tbody>
              {myEnrollments.map((enrollment) => {
                const course = courseMap.get(enrollment.courseId)
                return (
                  <tr key={enrollment.id}>
                    <td>
                      {course ? (
                        <Link to={`/student/courses/${course.id}`}>{course.title}</Link>
                      ) : (
                        `Curso #${enrollment.courseId}`
                      )}
                    </td>
                    <td>{formatDateTime(enrollment.enrollmentDate)}</td>
                    <td className="cell-number">{formatCurrency(enrollment.finalAmount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
