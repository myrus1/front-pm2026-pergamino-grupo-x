// Contrato de POST /voz del servicio del asistente.

export interface TurnoHistorial {
  rol: 'usuario' | 'asistente'
  texto: string
}

export type TipoAccion = 'lectura' | 'escritura' | 'borrado'

export interface AccionAsistente {
  herramienta: string
  ok: boolean
  tipo: TipoAccion
}

export interface DatosAsistente {
  filas: Record<string, unknown>[]
  total: number
}

/** Cómo revertir la última escritura. `ruta` es relativa a /api y se manda con apiFetch. */
export interface AccionDeshacer {
  metodo: 'DELETE'
  ruta: string
  descripcion: string
}

export interface PendienteAsistente {
  id: string
  descripcion: string
}

export interface SecretoAsistente {
  etiqueta: string
  valor: string
}

/** Pantalla que acompaña la respuesta: el front la traduce a su ruta (ver voice/pantallas.ts). */
export interface PantallaAsistente {
  nombre: string
  id: number | null
}

export interface RespuestaVoz {
  transcripcion: string | null
  respuesta: string
  acciones: AccionAsistente[]
  datos: DatosAsistente | null
  deshacer: AccionDeshacer | null
  pendiente: PendienteAsistente | null
  secreto: SecretoAsistente | null
  /** Puede faltar si el servicio es anterior a este campo. */
  pantalla?: PantallaAsistente | null
}
