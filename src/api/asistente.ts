import { stripBearer } from '../auth/jwt'
import type { RespuestaVoz, TurnoHistorial } from '../types/asistente'
import { ApiError, readSessionToken } from './client'

const ASISTENTE_URL = (import.meta.env.VITE_ASISTENTE_URL ?? '').replace(/\/+$/, '')

/** El asistente es opcional: sin VITE_ASISTENTE_URL el front no muestra nada de voz. */
export function asistenteDisponible(): boolean {
  return Boolean(ASISTENTE_URL)
}

interface EnviarVozParams {
  audio?: Blob
  historial: TurnoHistorial[]
  pendienteId?: string
  confirmar?: boolean
}

/** Extrae el `detail` del error del servicio, si vino como JSON. */
async function leerDetalle(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as { detail?: unknown }
    return typeof data?.detail === 'string' && data.detail.trim() ? data.detail : null
  } catch {
    return null
  }
}

export async function enviarVoz({
  audio,
  historial,
  pendienteId,
  confirmar,
}: EnviarVozParams): Promise<RespuestaVoz> {
  const form = new FormData()
  if (audio) {
    const nombre = audio.type.includes('mp4') ? 'voz.m4a' : 'voz.webm'
    form.append('audio', audio, nombre)
  }
  form.append('historial', JSON.stringify(historial))
  if (pendienteId) {
    form.append('pendiente_id', pendienteId)
  }
  if (confirmar) {
    form.append('confirmar', 'true')
  }

  // Sin Content-Type: el navegador arma el boundary del multipart.
  const headers = new Headers()
  const token = stripBearer(readSessionToken() ?? '')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${ASISTENTE_URL}/voz`, { method: 'POST', headers, body: form })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el asistente.')
  }

  if (!response.ok) {
    const detalle = await leerDetalle(response)
    throw new ApiError(response.status, detalle ?? `El asistente no pudo responder (${response.status}).`)
  }

  return (await response.json()) as RespuestaVoz
}
