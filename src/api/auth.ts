import type { Administrator, Instructor, Role, SessionUser } from '../types/domain'
import { decodeJwtPayload, isTokenExpired, roleFromBackend, stripBearer } from '../auth/jwt'
import { ApiError, apiFetch } from './client'

interface TokenResponse {
  token: string
}

export interface LoginResponse {
  token: string
  user: SessionUser
}

/**
 * Los logins viven fuera de /api y son uno por tipo de usuario. Como la respuesta
 * solo trae el token (el rol viaja en el JWT), se prueban en orden hasta que uno
 * acepte las credenciales: así el usuario no tiene que elegir su tipo.
 */
const AUTH_ENDPOINTS = ['/student/auth', '/instructor/auth', '/administrator/auth'] as const

async function requestToken(path: string, email: string, password: string): Promise<string> {
  const { token } = await apiFetch<TokenResponse>(path, {
    method: 'POST',
    body: { email, password },
    base: 'root',
    authToken: null,
    skipUnauthorized: true,
  })

  if (typeof token !== 'string' || !token.trim()) {
    throw new ApiError(500, 'El servidor no devolvió un token de sesión.')
  }

  return stripBearer(token)
}

async function findToken(email: string, password: string): Promise<string> {
  for (const path of AUTH_ENDPOINTS) {
    try {
      return await requestToken(path, email, password)
    } catch (cause) {
      // Credenciales inválidas para este tipo de usuario: probamos con el siguiente.
      if (cause instanceof ApiError && cause.status === 401) {
        continue
      }
      throw cause
    }
  }

  throw new ApiError(401, 'Email o contraseña incorrectos.')
}

function emptyProfile(user: Omit<SessionUser, 'firstName' | 'lastName'>): SessionUser {
  return { ...user, firstName: '', lastName: '' }
}

/**
 * El token solo identifica al usuario (email, rol e id). El nombre se pide al
 * endpoint correspondiente. El alumno no tiene endpoint propio (GET /students/{id}
 * es solo para administradores), así que la UI muestra su email.
 */
async function loadProfile(
  role: Role,
  id: number,
  email: string,
  token: string,
): Promise<SessionUser> {
  const base = { id, role, email }

  if (role === 'INSTRUCTOR') {
    try {
      const instructor = await apiFetch<Instructor>(`/instructors/${id}`)
      return { ...base, firstName: instructor.firstName, lastName: instructor.lastName }
    } catch {
      return emptyProfile(base)
    }
  }

  if (role === 'ADMIN') {
    try {
      const administrator = await apiFetch<Administrator>(`/administrators/${id}`, { authToken: token })
      return { ...base, firstName: administrator.firstName, lastName: administrator.lastName }
    } catch {
      return emptyProfile(base)
    }
  }

  return emptyProfile(base)
}

/**
 * Inicia sesión con email y contraseña.
 *
 * Prueba los tres endpoints de autenticación hasta encontrar el que corresponde
 * al usuario, decodifica el JWT para obtener el rol y completa el perfil.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const trimmedEmail = email.trim()
  if (!trimmedEmail || !password) {
    throw new ApiError(400, 'Ingresá tu email y contraseña.')
  }

  const token = await findToken(trimmedEmail, password)
  const payload = decodeJwtPayload(token)

  if (!payload) {
    throw new ApiError(500, 'El servidor devolvió un token inválido.')
  }

  if (isTokenExpired(payload)) {
    throw new ApiError(401, 'Tu sesión expiró. Volvé a iniciar sesión.')
  }

  const role = roleFromBackend(payload.rol)
  const id = typeof payload.userId === 'number' ? payload.userId : Number(payload.userId)

  if (!role || !Number.isInteger(id)) {
    throw new ApiError(500, 'El token no contiene el rol o el identificador del usuario.')
  }

  const user = await loadProfile(role, id, payload.sub ?? trimmedEmail, token)
  return { token, user }
}
