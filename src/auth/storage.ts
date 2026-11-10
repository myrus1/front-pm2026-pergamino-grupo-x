import type { AuthSession } from '../types/domain'

export const SESSION_STORAGE_KEY = 'elearning.session'

export function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.token || !parsed?.user?.id || !parsed.user.role) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function persistSession(session: AuthSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
