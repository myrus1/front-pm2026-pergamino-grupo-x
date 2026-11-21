import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '../api/client'
import { enviarVoz } from '../api/asistente'
import { useToast } from '../components/useToast'
import type { PantallaAsistente, RespuestaVoz, SecretoAsistente, TurnoHistorial } from '../types/asistente'
import { useAudioRecorder } from './useAudioRecorder'

export type EstadoAsistente = 'listo' | 'escuchando' | 'pensando'

const MAX_TURNOS = 6
export const DESHACER_MS = 10_000

function mensajeDe(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'No se pudo completar el pedido.'
}

interface Params {
  alCambiar(): void
  /** Se llama con cada respuesta nueva del asistente (para leerla en voz alta). */
  alResponder?(texto: string): void
  /** Se llama cuando la respuesta trae la pantalla que acompaña lo que hizo el asistente. */
  alNavegar?(pantalla: PantallaAsistente): void
}

export function useAsistente({ alCambiar, alResponder, alNavegar }: Params) {
  const { showToast } = useToast()
  const grabador = useAudioRecorder()
  const [pensando, setPensando] = useState(false)
  // `respuesta` se guarda sin secreto: la contraseña vive aparte para poder borrarla al cerrar
  // el panel o al empezar otro pedido sin tocar `respuesta` (y sin reiniciar el timer de deshacer).
  const [respuesta, setRespuesta] = useState<RespuestaVoz | null>(null)
  const [secreto, setSecreto] = useState<SecretoAsistente | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [deshacerVencido, setDeshacerVencido] = useState<RespuestaVoz | null>(null)
  const [deshaciendo, setDeshaciendo] = useState(false)

  // Historial en memoria: nunca incluye secreto.valor, solo la transcripción y el texto de respuesta.
  const historialRef = useRef<TurnoHistorial[]>([])
  const ocupadoRef = useRef(false)
  const alCambiarRef = useRef(alCambiar)
  const alResponderRef = useRef(alResponder)
  const alNavegarRef = useRef(alNavegar)
  useEffect(() => {
    alCambiarRef.current = alCambiar
    alResponderRef.current = alResponder
    alNavegarRef.current = alNavegar
  })

  // "Deshacer" se ofrece solo 10 segundos: al vencer se marca la respuesta como vencida.
  useEffect(() => {
    if (!respuesta?.deshacer) {
      return
    }
    const vigente = respuesta
    const timer = window.setTimeout(() => setDeshacerVencido(vigente), DESHACER_MS)
    return () => window.clearTimeout(timer)
  }, [respuesta])
  const deshacerVisible = Boolean(respuesta?.deshacer) && deshacerVencido !== respuesta

  const registrar = useCallback((r: RespuestaVoz) => {
    const nuevos: TurnoHistorial[] = []
    if (r.transcripcion) {
      nuevos.push({ rol: 'usuario', texto: r.transcripcion })
    }
    nuevos.push({ rol: 'asistente', texto: r.respuesta })
    historialRef.current = [...historialRef.current, ...nuevos].slice(-MAX_TURNOS)
  }, [])

  const procesar = useCallback(
    async (pedido: () => Promise<RespuestaVoz>, esConfirmacion = false) => {
      ocupadoRef.current = true
      setPensando(true)
      setError(null)
      setSecreto(null)
      setPanelAbierto(true)
      try {
        const r = await pedido()
        registrar(r)
        setSecreto(r.secreto)
        setRespuesta({ ...r, secreto: null })
        alResponderRef.current?.(r.respuesta)
        if (esConfirmacion || r.acciones.some((a) => a.ok && a.tipo !== 'lectura')) {
          alCambiarRef.current()
        }
        if (r.pantalla) {
          alNavegarRef.current?.(r.pantalla)
        }
      } catch (err) {
        setError(mensajeDe(err))
      } finally {
        ocupadoRef.current = false
        setPensando(false)
      }
    },
    [registrar],
  )

  const empezar = useCallback(async () => {
    if (ocupadoRef.current) {
      return
    }
    setError(null)
    await grabador.empezar()
  }, [grabador])

  const terminar = useCallback(async () => {
    const audio = await grabador.terminar()
    if (!audio || audio.size === 0) {
      return
    }
    // Si hay un borrado esperando confirmación, va con el audio: un "sí" por voz lo confirma
    // y cualquier otra cosa lo descarta en el servicio.
    const pendienteId = respuesta?.pendiente?.id
    await procesar(() => enviarVoz({ audio, historial: historialRef.current, pendienteId }))
  }, [grabador, procesar, respuesta])

  const confirmar = useCallback(
    async (confirmado: boolean) => {
      const pendiente = respuesta?.pendiente
      if (!pendiente || ocupadoRef.current) {
        return
      }
      if (!confirmado) {
        const cancelado = 'Cancelado, no hice ningún cambio.'
        setRespuesta({ ...respuesta, pendiente: null, deshacer: null, respuesta: cancelado })
        alResponderRef.current?.(cancelado)
        return
      }
      await procesar(
        () => enviarVoz({ historial: historialRef.current, pendienteId: pendiente.id, confirmar: true }),
        true,
      )
    },
    [procesar, respuesta],
  )

  const deshacer = useCallback(async () => {
    const accion = respuesta?.deshacer
    if (!accion || deshaciendo) {
      return
    }
    setDeshaciendo(true)
    try {
      await apiFetch(accion.ruta, { method: accion.metodo })
      setDeshacerVencido(respuesta)
      showToast('Cambio deshecho.')
      alCambiarRef.current()
    } catch (err) {
      showToast(mensajeDe(err), 'error')
    } finally {
      setDeshaciendo(false)
    }
  }, [deshaciendo, respuesta, showToast])

  const respuestaVisible = useMemo(
    () => (respuesta ? { ...respuesta, secreto } : null),
    [respuesta, secreto],
  )

  const cerrarPanel = useCallback(() => {
    setPanelAbierto(false)
    setSecreto(null)
  }, [])

  const estado: EstadoAsistente = pensando ? 'pensando' : grabador.estado === 'grabando' ? 'escuchando' : 'listo'

  return {
    estado,
    stream: grabador.stream,
    respuesta: respuestaVisible,
    error: error ?? grabador.error,
    panelAbierto,
    cerrarPanel,
    deshacerVisible,
    deshaciendo,
    empezar,
    terminar,
    confirmar,
    deshacer,
  }
}
