import { useMemo, useState } from 'react'
import { getCourses } from '../../api/courses'
import { getEnrollments } from '../../api/enrollments'
import { getInstructors } from '../../api/instructors'
import { getSpecialties } from '../../api/specialties'
import { Bookshelf } from '../../components/Bookshelf'
import { FeaturedReleases } from '../../components/FeaturedReleases'
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

  const describe = (course: (typeof visibleCourses)[number]) => {
    const count = enrollmentCounts.get(course.id) ?? 0
    const spots = Math.max(course.maxCapacity - count, 0)
    const started = isTodayOrPast(course.startDate)
    return { spots, started }
  }

  const featured = (data?.courses ?? [])
    .filter((course) => course.status === 'PUBLISHED' && !isTodayOrPast(course.startDate))
    .sort((first, second) => first.startDate.localeCompare(second.startDate))
    .slice(0, 6)

  return (
    <section>
      {featured.length > 1 && (
        <FeaturedReleases
          items={featured.map((course) => ({
            id: course.id,
            title: course.title,
            kicker: specialtyMap.get(course.specialtyId ?? 0) ?? 'Sin especialidad',
            byline: instructorMap.get(course.instructorId ?? 0),
            meta: `Empieza el ${formatDate(course.startDate)}`,
            to: `/student/courses/${course.id}`,
          }))}
        />
      )}

      <header className="page-header">
        <div>
          <h1>Catálogo</h1>
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
            placeholder="Ej. Bases de datos"
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
        <Bookshelf
          items={visibleCourses.map((course) => {
            const { spots, started } = describe(course)
            return {
              id: course.id,
              title: course.title,
              kicker: specialtyMap.get(course.specialtyId ?? 0) ?? 'Sin especialidad',
              byline: instructorMap.get(course.instructorId ?? 0),
              to: `/student/courses/${course.id}`,
              details: (
                <dl className="shelf__facts">
                  <div>
                    <dt>Fechas</dt>
                    <dd>
                      {formatDate(course.startDate)} – {formatDate(course.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt>Precio</dt>
                    <dd>{formatCurrency(course.basePrice)}</dd>
                  </div>
                  <div>
                    <dt>Cupo</dt>
                    <dd>
                      <span className={`badge ${spots === 0 || started ? 'badge--muted' : 'badge--success'}`}>
                        {started ? 'Comenzado' : spots === 0 ? 'Sin cupo' : `${spots} cupos`}
                      </span>
                    </dd>
                  </div>
                </dl>
              ),
            }
          })}
        />
      )}
    </section>
  )
}
