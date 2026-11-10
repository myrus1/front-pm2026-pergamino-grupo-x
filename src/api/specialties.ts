import type { Specialty } from '../types/domain'
import { apiFetch } from './client'

export function getSpecialties(): Promise<Specialty[]> {
  return apiFetch<Specialty[]>('/specialties')
}
