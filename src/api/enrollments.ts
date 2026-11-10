import type { Enrollment, Revenue } from '../types/domain'
import { apiFetch } from './client'

export function getEnrollments(): Promise<Enrollment[]> {
  return apiFetch<Enrollment[]>('/enrollments')
}

export function getEnrollmentRevenue(): Promise<Revenue> {
  return apiFetch<Revenue>('/enrollments/revenue')
}

export function createEnrollment(studentId: number, courseId: number): Promise<Enrollment> {
  return apiFetch<Enrollment>('/enrollments', {
    method: 'POST',
    body: { studentId, courseId },
  })
}
