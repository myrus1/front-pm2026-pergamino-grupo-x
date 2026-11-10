import type { ApprovalStatus, CourseStatus, Role } from '../types/domain'

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente de aprobación',
  PUBLISHED: 'Publicado',
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  SUBMITTED: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Estudiante',
}

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim()
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
