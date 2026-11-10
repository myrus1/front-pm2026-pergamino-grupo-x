import type { Course } from '../types/domain'
import { isTodayOrPast } from './format'

export interface EnrollmentEligibility {
  canEnroll: boolean
  reason: string | null
}

/**
 * Reglas de inscripción (el backend es la fuente de verdad):
 * curso publicado, fecha actual anterior al inicio y cupo disponible.
 */
export function getEnrollmentEligibility(
  course: Course,
  enrolledCount: number,
  alreadyEnrolled: boolean,
): EnrollmentEligibility {
  if (course.status !== 'PUBLISHED') {
    return { canEnroll: false, reason: 'El curso no está publicado.' }
  }
  if (alreadyEnrolled) {
    return { canEnroll: false, reason: 'Ya estás inscripto en este curso.' }
  }
  if (isTodayOrPast(course.startDate)) {
    return { canEnroll: false, reason: 'La inscripción está cerrada: el curso ya comenzó.' }
  }
  if (enrolledCount >= course.maxCapacity) {
    return { canEnroll: false, reason: 'No hay cupo disponible.' }
  }
  return { canEnroll: true, reason: null }
}
