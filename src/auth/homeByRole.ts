import type { Role } from '../types/domain'

export const HOME_BY_ROLE: Record<Role, string> = {
  ADMIN: '/admin/requests',
  INSTRUCTOR: '/instructor/courses',
  STUDENT: '/student/catalog',
}
