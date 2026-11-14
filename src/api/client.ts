// Por defecto se usa una ruta relativa para aprovechar el proxy de Vite (evita CORS en desarrollo).
// El backend actual no configura CORS, por eso apuntar directo a http://localhost:8080/api
// requiere habilitarlo del lado del servidor.
import { stripBearer } from '../auth/jwt'
import { SESSION_STORAGE_KEY } from '../auth/storage'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '')

/** Lee el token de la sesión persistida para no depender del orden de montaje de React. */
function readSessionToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as { token?: unknown }
    return typeof parsed?.token === 'string' ? parsed.token : null
  } catch {
    return null
  }
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión expiró. Volvé a iniciar sesión.',
  403: 'No tenés permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'La operación entra en conflicto con los datos actuales.',
  500: 'Ocurrió un error en el servidor. Intentá nuevamente más tarde.',
}

type TokenGetter = () => string | null

let tokenGetter: TokenGetter = readSessionToken
let onUnauthorized: (() => void) | null = null

/** Registra la sesión activa para adjuntar el token y reaccionar a 401/403. */
export function configureApi(getToken: TokenGetter, handleUnauthorized: () => void) {
  tokenGetter = getToken
  onUnauthorized = handleUnauthorized
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /**
   * 'api' (default) antepone VITE_API_URL. 'root' usa la ruta tal cual, necesario
   * para los logins (/student/auth, /instructor/auth, /administrator/auth), que
   * viven fuera de /api.
   */
  base?: 'api' | 'root'
  /** Token explícito para esta request (p. ej. al hidratar el perfil antes de persistir la sesión). */
  authToken?: string | null
  /** Evita el logout global en un 401 (se usa al probar los endpoints de login). */
  skipUnauthorized?: boolean
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, base = 'api', authToken, skipUnauthorized, ...init } = options
  const headers = new Headers(init.headers)

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = stripBearer(authToken !== undefined ? (authToken ?? '') : (tokenGetter() ?? ''))
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = base === 'root' ? path : `${API_URL}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verificá que el backend esté disponible.')
  }

  if (response.status === 401 && !skipUnauthorized) {
    onUnauthorized?.()
  }

  if (!response.ok) {
    let message = FALLBACK_MESSAGES[response.status] ?? `Error inesperado (${response.status}).`
    try {
      const data: unknown = await response.json()
      if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>
        const backendMessage = record.mensaje ?? record.message
        if (typeof backendMessage === 'string' && backendMessage.trim()) {
          message = backendMessage
        }
      }
    } catch {
      // El backend no devolvió JSON: se mantiene el mensaje por código de estado.
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/** Convierte un objeto en query string omitiendo valores vacíos. */
export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
