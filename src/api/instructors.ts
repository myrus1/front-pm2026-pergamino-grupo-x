import type { Instructor, InstructorPayload, Revenue } from '../types/domain'
import { apiFetch } from './client'

export function getInstructors(): Promise<Instructor[]> {
  return apiFetch<Instructor[]>('/instructors')
}

export function createInstructor(payload: InstructorPayload): Promise<Instructor> {
  return apiFetch<Instructor>('/instructors', { method: 'POST', body: payload })
}

export function getInstructorRevenue(id: number): Promise<Revenue> {
  return apiFetch<Revenue>(`/instructors/${id}/revenue`)
}

export function assignInstructorSpecialty(instructorId: number, specialtyId: number): Promise<void> {
  return apiFetch<void>(`/instructors/${instructorId}/specialties/${specialtyId}`, { method: 'PUT' })
}

export function removeInstructorSpecialty(instructorId: number, specialtyId: number): Promise<void> {
  return apiFetch<void>(`/instructors/${instructorId}/specialties/${specialtyId}`, { method: 'DELETE' })
}
