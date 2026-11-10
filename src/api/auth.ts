import type { Administrator, Instructor, SessionUser, Student } from '../types/domain'
import { ApiError, apiFetch } from './client'
import { getAdministrators } from './administrators'
import { getInstructors } from './instructors'
import { getStudents } from './students'

interface LoginResponse {
  token: string
  user: SessionUser
}

const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT

function toSessionUser(
  person: Student | Instructor | Administrator,
  role: SessionUser['role'],
): SessionUser {
  return {
    id: person.id,
    role,
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
  }
}

/**
 * Inicia sesión.
 *
 * Si `VITE_AUTH_ENDPOINT` está definido se usa el endpoint real del backend.
 * Caso contrario se usa el modo demo: se busca el email entre administradores,
 * instructores y alumnos. El backend actual no expone autenticación ni verifica
 * contraseñas, por eso en modo demo solo se valida la existencia del email.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  if (AUTH_ENDPOINT) {
    return apiFetch<LoginResponse>(AUTH_ENDPOINT, {
      method: 'POST',
      body: { email, password },
    })
  }

  if (!password) {
    throw new ApiError(400, 'Ingresá una contraseña.')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const [administrators, instructors, students] = await Promise.all([
    getAdministrators(),
    getInstructors(),
    getStudents(),
  ])

  const administrator = administrators.find((item) => item.email.toLowerCase() === normalizedEmail)
  if (administrator) {
    return {
      token: `demo-admin-${administrator.id}`,
      user: toSessionUser(administrator, 'ADMIN'),
    }
  }

  const instructor = instructors.find((item) => item.email.toLowerCase() === normalizedEmail)
  if (instructor) {
    return {
      token: `demo-instructor-${instructor.id}`,
      user: toSessionUser(instructor, 'INSTRUCTOR'),
    }
  }

  const student = students.find((item) => item.email.toLowerCase() === normalizedEmail)
  if (student) {
    return {
      token: `demo-student-${student.id}`,
      user: toSessionUser(student, 'STUDENT'),
    }
  }

  throw new ApiError(401, 'No existe una cuenta registrada con ese email.')
}
