import { useMemo } from 'react'
import { useToast } from '../components/useToast'
import type { RespuestaVoz } from '../types/asistente'
import { armarTabla } from './tablaVoz'

interface Props {
  respuesta: RespuestaVoz | null
  error: string | null
  pensando: boolean
  /** Lo que mostró el texto en vivo, hasta que llega la transcripción de Whisper. */
  textoProvisional: string
  /** La tabla se muestra solo si la respuesta no abrió una pantalla con esos datos. */
  conTabla: boolean
  soloAviso: boolean
  deshacerVisible: boolean
  deshaciendo: boolean
  vozDisponible: boolean
  vozActiva: boolean
  alAlternarVoz(): void
  alCerrar(): void
  alConfirmar(confirmado: boolean): void
  alDeshacer(): void
}

function IconoParlante({ activo }: { activo: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {activo ? (
        <path
          d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  )
}

function IconoCerrar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function PanelVoz({
  respuesta,
  error,
  pensando,
  textoProvisional,
  conTabla,
  soloAviso,
  deshacerVisible,
  deshaciendo,
  vozDisponible,
  vozActiva,
  alAlternarVoz,
  alCerrar,
  alConfirmar,
  alDeshacer,
}: Props) {
  const { showToast } = useToast()

  const copiar = async (valor: string) => {
    try {
      await navigator.clipboard.writeText(valor)
      showToast('Copiado al portapapeles.')
    } catch {
      showToast('No se pudo copiar. Seleccionalo y copialo a mano.', 'error')
    }
  }

  const filas = respuesta?.datos?.filas
  const tabla = useMemo(() => (filas && filas.length > 0 ? armarTabla(filas) : null), [filas])
  const restantes = respuesta?.datos ? respuesta.datos.total - (filas?.length ?? 0) : 0

  return (
    <section className={`voz-panel${soloAviso ? ' voz-panel--aviso' : ''}`} aria-label="Asistente de voz">
      <header className="voz-panel__header">
        <span className="voz-panel__titulo">
          <span className="voz-panel__marca" aria-hidden="true" />
          Asistente
        </span>
        <div className="voz-panel__herramientas">
          {vozDisponible && (
            <button
              type="button"
              className={`voz-icono${vozActiva ? ' voz-icono--activo' : ''}`}
              onClick={alAlternarVoz}
              aria-pressed={vozActiva}
              title={vozActiva ? 'Dejar de leer las respuestas' : 'Leer las respuestas en voz alta'}
            >
              <IconoParlante activo={vozActiva} />
              <span className="sr-only">Respuesta en voz alta</span>
            </button>
          )}
          <button type="button" className="voz-icono" onClick={alCerrar} title="Cerrar">
            <IconoCerrar />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
      </header>

      <div className="voz-panel__body" aria-live="polite">
        {pensando && textoProvisional && (
          <p className="voz-burbuja voz-burbuja--vos">
            <span className="voz-burbuja__quien">Vos</span>
            {textoProvisional}
          </p>
        )}

        {!pensando && respuesta?.transcripcion && !error && (
          <p className="voz-burbuja voz-burbuja--vos">
            <span className="voz-burbuja__quien">Vos</span>
            {respuesta.transcripcion}
          </p>
        )}

        {pensando && (
          <p className="voz-burbuja voz-burbuja--asistente voz-pensando" aria-label="Pensando">
            <span />
            <span />
            <span />
          </p>
        )}

        {error && !pensando && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        {respuesta && !pensando && !error && (
          <>
            <p className="voz-burbuja voz-burbuja--asistente">{respuesta.respuesta}</p>

            {conTabla && tabla && (
              <div className="voz-tabla">
                <table>
                  <thead>
                    <tr>
                      {tabla.columnas.map((c) => (
                        <th key={c.clave}>{c.titulo}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.filas.map((fila, i) => (
                      <tr key={i}>
                        {fila.map((valor, j) => (
                          <td key={tabla.columnas[j].clave}>{valor}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {conTabla && restantes > 0 && <p className="voz-panel__nota">y {restantes} más</p>}

            {respuesta.secreto && (
              <div className="voz-tarjeta">
                <strong>{respuesta.secreto.etiqueta}</strong>
                <div className="voz-tarjeta__fila">
                  <code>{respuesta.secreto.valor}</code>
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    onClick={() => void copiar(respuesta.secreto!.valor)}
                  >
                    Copiar
                  </button>
                </div>
                <small>Se muestra una sola vez.</small>
              </div>
            )}

            {respuesta.pendiente && (
              <div className="voz-tarjeta voz-tarjeta--peligro">
                <p>{respuesta.pendiente.descripcion}</p>
                <div className="voz-tarjeta__fila">
                  <button type="button" className="button button--danger button--small" onClick={() => alConfirmar(true)}>
                    Sí, borrar
                  </button>
                  <button type="button" className="button button--ghost button--small" onClick={() => alConfirmar(false)}>
                    No
                  </button>
                  <small>o decí «sí»</small>
                </div>
              </div>
            )}

            {respuesta.deshacer && deshacerVisible && (
              <div className="voz-tarjeta voz-tarjeta--deshacer">
                <small>{respuesta.deshacer.descripcion}</small>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  onClick={alDeshacer}
                  disabled={deshaciendo}
                >
                  Deshacer
                </button>
                <span className="voz-tarjeta__cuenta" aria-hidden="true" />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
