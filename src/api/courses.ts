import type { Course, CoursePayload } from '../types/domain'
import { apiFetch } from './client'

/**
 * El backend solo filtra por studentId; estado y especialidad se filtran en el front.
 * Ver API_CONTRACT.md (discrepancia con el contrato del enunciado).
 */
export function getCourses(): Promise<Course[]> {
  return apiFetch<Course[]>('/courses')
}

export function getCourse(id: number): Promise<Course> {
  return apiFetch<Course>(`/courses/${id}`)
}

export function createCourse(payload: CoursePayload): Promise<Course> {
  return apiFetch<Course>('/courses', { method: 'POST', body: payload })
}

export function updateCourse(id: number, payload: CoursePayload): Promise<Course> {
  return apiFetch<Course>(`/courses/${id}`, { method: 'PUT', body: payload })
}

export function deleteCourse(id: number): Promise<void> {
  return apiFetch<void>(`/courses/${id}`, { method: 'DELETE' })
}
