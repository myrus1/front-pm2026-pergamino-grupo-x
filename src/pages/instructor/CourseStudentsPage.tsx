import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../../api/courses'
import { getEnrollments } from '../../api/enrollments'
import { getStudents } from '../../api/students'
import { useAuth } from '../../auth/useAuth'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { formatDateTime } from '../../utils/format'
import { useApiResource } from '../../utils/useApiResource'

export function CourseStudentsPage() {
  const { id } = useParams()
  const courseId = Number(id)
  const { user } = useAuth()

  const resource = useApiResource(async () => {
    const [course, students, enrollments] = await Promise.all([
      getCourse(courseId),
      getStudents(courseId),
      getEnrollments(),
    ])
    return { course, students, enrollments }
  }, [courseId])

  const enrollmentDateByStudent = useMemo(() => {
    const dates = new Map<number, string>()
    for (const enrollment of resource.data?.enrollments ?? []) {
      if (enrollment.courseId === courseId) {
        dates.set(enrollment.studentId, enrollment.enrollmentDate)
      }
    }
    return dates
  }, [resource.data, courseId])

  if (Number.isNaN(courseId)) {
    return <ErrorState message="El curso indicado no es válido." />
  }

  if (resource.loading) {
    return <LoadingState message="Cargando inscriptos…" />
  }

  if (resource.error || !resource.data) {
    return <ErrorState message={resource.error ?? 'No se pudo cargar el curso.'} onRetry={resource.reload} />
  }

  const { course, students } = resource.data

  if (course.instructorId !== user?.id) {
    return <ErrorState message="No podés ver los inscriptos de un curso que no te pertenece." />
  }

  return (
    <section>
      <p className="breadcrumb">
        <Link to="/instructor/courses">← Volver a mis cursos</Link>
      </p>
      <header className="page-header">
        <div>
          <h1>Inscriptos: {course.title}</h1>
          <p className="muted">
            {students.length} de {course.maxCapacity} cupos ocupados.
          </p>
        </div>
      </header>

      {students.length === 0 ? (
        <EmptyState message="Todavía no hay estudiantes inscriptos en este curso." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Fecha de inscripción</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.firstName}</td>
                  <td>{student.lastName}</td>
                  <td>{student.dni}</td>
                  <td>{student.email}</td>
                  <td>{formatDateTime(enrollmentDateByStudent.get(student.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
