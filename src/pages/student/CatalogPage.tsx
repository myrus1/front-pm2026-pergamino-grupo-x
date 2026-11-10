import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../../api/courses'
import { getEnrollments } from '../../api/enrollments'
import { getInstructors } from '../../api/instructors'
import { getSpecialties } from '../../api/specialties'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { formatCurrency, formatDate, isTodayOrPast } from '../../utils/format'
import { fullName } from '../../utils/labels'
import { useApiResource } from '../../utils/useApiResource'

interface CatalogData {
  courses: Awaited<ReturnType<typeof getCourses>>
  specialties: Awaited<ReturnType<typeof getSpecialties>>
  instructors: Awaited<ReturnType<typeof getInstructors>>
  enrollments: Awaited<ReturnType<typeof getEnrollments>>
}

export function CatalogPage() {
  const resource = useApiResource<CatalogData>(async () => {
    const [courses, specialties, instructors, enrollments] = await Promise.all([
      getCourses(),
      getSpecialties(),
      getInstructors(),
      getEnrollments(),
    ])
    return { courses, specialties, instructors, enrollments }
  }, [])

  const [search, setSearch] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')

  const data = resource.data

  const specialtyMap = useMemo(
    () => new Map((data?.specialties ?? []).map((item) => [item.id, item.name])),
    [data],
  )
  const instructorMap = useMemo(
    () => new Map((data?.instructors ?? []).map((item) => [item.id, fullName(item)])),
    [data],
  )
  const enrollmentCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const enrollment of data?.enrollments ?? []) {
      counts.set(enrollment.courseId, (counts.get(enrollment.courseId) ?? 0) + 1)
    }
    return counts
  }, [data])

  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (data?.courses ?? [])
      .filter((course) => course.status === 'PUBLISHED')
      .filter((course) => (specialtyId ? course.specialtyId === Number(specialtyId) : true))
      .filter((course) => (term ? course.title.toLowerCase().includes(term) : true))
      .sort((first, second) => first.startDate.localeCompare(second.startDate))
  }, [data, search, specialtyId])

  if (resource.loading) {
    return <LoadingState message="Cargando catálogo…" />
  }

  if (resource.error) {
    return <ErrorState message={resource.error} onRetry={resource.reload} />
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Catálogo de cursos</h1>
          <p className="muted">Cursos publicados disponibles para inscribirse.</p>
        </div>
        <span className="count-pill">
          {visibleCourses.length} {visibleCourses.length === 1 ? 'curso' : 'cursos'}
        </span>
      </header>

      <div className="filters">
        <label className="field">
          <span className="field__label">Buscar por título</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ej. React avanzado"
          />
        </label>
        <label className="field">
          <span className="field__label">Especialidad</span>
          <select value={specialtyId} onChange={(event) => setSpecialtyId(event.target.value)}>
            <option value="">Todas</option>
            {(data?.specialties ?? []).map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleCourses.length === 0 ? (
        <EmptyState message="No hay cursos que coincidan con los filtros." />
      ) : (
        <div className="card-grid">
          {visibleCourses.map((course) => {
            const count = enrollmentCounts.get(course.id) ?? 0
            const spots = Math.max(course.maxCapacity - count, 0)
            const started = isTodayOrPast(course.startDate)
            return (
              <Link
                key={course.id}
                className="course-card"
                to={`/student/courses/${course.id}`}
                aria-label={`Ver detalle de ${course.title}`}
              >
                <div className="course-card__top">
                  <span
                    className="tag"
                    title={specialtyMap.get(course.specialtyId ?? 0) ?? 'Sin especialidad'}
                  >
                    {specialtyMap.get(course.specialtyId ?? 0) ?? 'Sin especialidad'}
                  </span>
                  <span className={`badge ${spots === 0 || started ? 'badge--muted' : 'badge--success'}`}>
                    {started ? 'Comenzado' : spots === 0 ? 'Sin cupo' : `${spots} cupos`}
                  </span>
                </div>
                <h2>{course.title}</h2>
                <p className="course-card__instructor">
                  Instructor: {instructorMap.get(course.instructorId ?? 0) ?? '—'}
                </p>
                <p className="muted course-card__date">
                  {formatDate(course.startDate)} – {formatDate(course.endDate)}
                </p>
                <div className="course-card__footer">
                  <strong>{formatCurrency(course.basePrice)}</strong>
                  <span className="course-card__cta">Ver detalle</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
