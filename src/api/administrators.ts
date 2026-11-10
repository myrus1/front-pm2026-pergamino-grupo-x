import type { Administrator, AdministratorPayload } from '../types/domain'
import { apiFetch } from './client'

export function getAdministrators(): Promise<Administrator[]> {
  return apiFetch<Administrator[]>('/administrators')
}

export function createAdministrator(payload: AdministratorPayload): Promise<Administrator> {
  return apiFetch<Administrator>('/administrators', { method: 'POST', body: payload })
}
