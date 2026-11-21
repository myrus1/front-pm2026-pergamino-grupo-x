import type { ReactNode } from 'react'
import { CourseCover } from './CourseCover'

/** Nombre de un curso con su miniatura de portada, para las celdas de las tablas. */
export function CourseLabel({ id, title, children }: { id: number; title: string; children?: ReactNode }) {
  return (
    <span className="course-label">
      <CourseCover variant="thumb" seed={id} title={title} />
      <span className="course-label__title">{children ?? title}</span>
    </span>
  )
}
