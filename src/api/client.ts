// Por defecto se usa una ruta relativa para aprovechar el proxy de Vite (y el de nginx en
// producción). Si VITE_API_URL apunta directo al backend, el origen del front tiene que estar
// en CORS_ALLOWED_ORIGINS del backend (CorsConfig).
import { stripBearer } from '../auth/jwt'
import { SESSION_STORAGE_KEY } from '../auth/storage'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '')

/** Lee el token de la sesión persistida para no depender del orden de montaje de React. */
export function readSessionToken(): string | null {
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

/** Mensaje por campo, tal como llega en `errors[]` del ProblemDetail (`field` → `message`). */
export type ApiFieldErrors = Record<string, string>

interface ApiErrorDetails {
  /** Clave estable del error (`code` del ProblemDetail, p. ej. `data.integrity.conflict`). */
  code?: string
  fieldErrors?: ApiFieldErrors
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly fieldErrors: ApiFieldErrors

  constructor(status: number, message: string, details: ApiErrorDetails = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = details.code
    this.fieldErrors = details.fieldErrors ?? {}
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

/**
 * Códigos del backend que describen una falla técnica (ruta inexistente, cuerpo ilegible,
 * error interno). Para el usuario sirve más el texto por código de estado que el `detail`.
 */
const TECHNICAL_CODES = new Set([
  'internal.error',
  'http.not-found',
  'http.method-not-allowed',
  'http.unsupported-media-type',
  'http.not-acceptable',
  'request.malformed',
])

interface ParsedErrorBody {
  message?: string
  code?: string
  fieldErrors: ApiFieldErrors
}

/**
 * Lee el cuerpo de error del backend. Con el formato estándar (ProblemDetail, #25) el texto
 * viene en `detail`, la clave en `code` y los errores de validación en `errors[]`. Los
 * errores anteriores traen `{ "mensaje": "..." }`, así que se aceptan los dos.
 */
function parseErrorBody(data: unknown): ParsedErrorBody {
  const parsed: ParsedErrorBody = { fieldErrors: {} }
  if (!data || typeof data !== 'object') {
    return parsed
  }

  const record = data as Record<string, unknown>
  for (const key of ['detail', 'mensaje', 'message']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      parsed.message = value
      break
    }
  }

  if (typeof record.code === 'string') {
    parsed.code = record.code
  }

  if (Array.isArray(record.errors)) {
    for (const item of record.errors) {
      if (!item || typeof item !== 'object') {
        continue
      }
      const { field, message } = item as Record<string, unknown>
      if (typeof field === 'string' && typeof message === 'string' && !(field in parsed.fieldErrors)) {
        parsed.fieldErrors[field] = message
      }
    }
  }

  return parsed
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

  // Solo un pedido que llevaba token puede significar "la sesión venció".
  if (response.status === 401 && !skipUnauthorized && token) {
    onUnauthorized?.()
  }

  if (!response.ok) {
    const fallback = FALLBACK_MESSAGES[response.status] ?? `Error inesperado (${response.status}).`
    let parsed: ParsedErrorBody = { fieldErrors: {} }
    try {
      parsed = parseErrorBody(await response.json())
    } catch {
      // El backend no devolvió JSON: se mantiene el mensaje por código de estado.
    }
    const isTechnical = parsed.code !== undefined && TECHNICAL_CODES.has(parsed.code)
    const message = parsed.message && response.status < 500 && !isTechnical ? parsed.message : fallback
    throw new ApiError(response.status, message, { code: parsed.code, fieldErrors: parsed.fieldErrors })
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
