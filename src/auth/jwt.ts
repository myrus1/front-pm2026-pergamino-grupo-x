import type { Role } from '../types/domain'

/** Los tokens que emite el backend llegan con el prefijo "Bearer ". */
export function stripBearer(token: string): string {
  return token.replace(/^Bearer\s+/i, '').trim()
}

/** Claims que el backend incluye en el JWT (ver JwtTokenUtil del backend). */
export interface JwtPayload {
  sub?: string
  rol?: string
  userId?: number
  exp?: number
  iat?: number
}

/** El backend usa nombres de rol distintos a los del front. */
const ROLE_FROM_BACKEND: Record<string, Role> = {
  ALUMNO: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMINISTRADOR: 'ADMIN',
}

export function roleFromBackend(rol: string | undefined): Role | null {
  if (!rol) {
    return null
  }
  return ROLE_FROM_BACKEND[rol] ?? null
}

/**
 * Decodifica el payload del JWT sin validar la firma (el backend es quien la valida).
 * Devuelve `null` si el token no tiene forma de JWT.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const segment = stripBearer(token).split('.')[1]
    if (!segment) {
      return null
    }

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload
  } catch {
    return null
  }
}

/** Considera vencido un token con menos de 30 segundos de vida para evitar carreras. */
export function isTokenExpired(payload: JwtPayload, skewSeconds = 30): boolean {
  return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() + skewSeconds * 1000
}
