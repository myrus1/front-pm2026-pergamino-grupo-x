import type { Student, StudentPayload } from '../types/domain'
import { apiFetch, toQuery } from './client'

export function getStudents(courseId?: number): Promise<Student[]> {
  const query = toQuery({ courseId })
  return apiFetch<Student[]>(`/students${query}`)
}

export function createStudent(payload: StudentPayload): Promise<Student> {
  return apiFetch<Student>('/students', { method: 'POST', body: payload })
}
