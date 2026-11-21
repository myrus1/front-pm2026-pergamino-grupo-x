import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import type { PantallaAsistente } from '../types/asistente'
import { asistenteDisponible } from '../api/asistente'
import { PanelVoz } from './PanelVoz'
import { rutaDePantalla } from './pantallas'
import { useAsistente } from './useAsistente'
import { useNivelMicrofono } from './useNivelMicrofono'
import { useTextoEnVivo } from './useTextoEnVivo'
import { useVozAlta } from './useVozAlta'

interface Props {
  alCambiar(): void
}

const ETIQUETAS = {
  listo: 'Mantené apretado para hablar',
  escuchando: 'Escuchando… soltá para enviar',
  pensando: 'Pensando…',
} as const

const MAXIMO_SEGUNDOS = 60
// Un aviso sin nada para hacer se cierra solo.
const AVISO_MS = 6000

export function BotonVoz({ alCambiar }: Props) {
  if (!asistenteDisponible()) {
    return null
  }
  return <BotonVozActivo alCambiar={alCambiar} />
}

function IconoMicrofono() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function useSegundos(activo: boolean): number {
  const [segundos, setSegundos] = useState(0)
  useEffect(() => {
    if (!activo) {
      return
    }
    const inicio = Date.now()
    const timer = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 250)
    return () => {
      window.clearInterval(timer)
      setSegundos(0)
    }
  }, [activo])
  return segundos
}

function reloj(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}

function BotonVozActivo({ alCambiar }: Props) {
  const voz = useVozAlta()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const rol = user?.role ?? null
  const alNavegar = useCallback(
    (pantalla: PantallaAsistente) => {
      const ruta = rutaDePantalla(pantalla, rol)
      if (ruta && ruta !== pathname) {
        navigate(ruta)
      }
    },
    [navigate, pathname, rol],
  )
  const a = useAsistente({ alCambiar, alResponder: voz.hablar, alNavegar })
  // Evita que pointerleave dispare un segundo "terminar" después de pointerup.
  const punteroActivo = useRef(false)
  const botonRef = useRef<HTMLButtonElement>(null)

  const escuchando = a.estado === 'escuchando'
  const pensando = a.estado === 'pensando'
  const segundos = useSegundos(escuchando)
  const enVivo = useTextoEnVivo(escuchando)

  // Lo que hizo el asistente ya se ve en la pantalla: la respuesta queda como un aviso chico.
  const r = a.respuesta
  const conTabla = Boolean(r?.datos?.filas.length) && !r?.pantalla
  const soloAviso = Boolean(r) && !a.error && !pensando && !r?.pendiente && !r?.secreto && !conTabla
  const { panelAbierto, cerrarPanel, deshacerVisible } = a
  useEffect(() => {
    if (!panelAbierto || !soloAviso || deshacerVisible || escuchando) {
      return
    }
    const timer = window.setTimeout(cerrarPanel, AVISO_MS)
    return () => window.clearTimeout(timer)
  }, [panelAbierto, soloAviso, deshacerVisible, escuchando, cerrarPanel, r])
  useNivelMicrofono(escuchando ? a.stream : null, botonRef)

  const empezar = () => {
    // Si estaba leyendo una respuesta, se calla para escuchar.
    voz.callar()
    void a.empezar()
  }

  const alBajar = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || punteroActivo.current) {
      return
    }
    punteroActivo.current = true
    empezar()
  }

  const alSoltar = () => {
    if (!punteroActivo.current) {
      return
    }
    punteroActivo.current = false
    void a.terminar()
  }

  const alTeclear = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') {
      return
    }
    // El click nativo no se usa: el teclado alterna empezar/terminar acá.
    e.preventDefault()
    if (e.repeat) {
      return
    }
    if (escuchando) {
      void a.terminar()
    } else if (a.estado === 'listo') {
      empezar()
    }
  }

  const cerrar = () => {
    voz.callar()
    a.cerrarPanel()
  }

  return (
    <>
      {/* Mientras grabás, el lugar del panel lo ocupa el texto en vivo. */}
      {a.panelAbierto && !escuchando && (
        <PanelVoz
          respuesta={a.respuesta}
          error={a.error}
          pensando={pensando}
          textoProvisional={enVivo}
          conTabla={conTabla}
          soloAviso={soloAviso}
          deshacerVisible={a.deshacerVisible}
          deshaciendo={a.deshaciendo}
          vozDisponible={voz.disponible}
          vozActiva={voz.activa}
          alAlternarVoz={voz.alternar}
          alCerrar={cerrar}
          alConfirmar={(c) => void a.confirmar(c)}
          alDeshacer={() => void a.deshacer()}
        />
      )}
      {escuchando && (
        <p className="voz-vivo" aria-live="polite">
          {enVivo || <span className="voz-vivo__espera">Te escucho…</span>}
          <span className="voz-vivo__cursor" aria-hidden="true" />
        </p>
      )}
      <div className={`voz-dock voz-dock--${a.estado}`}>
        <button
          ref={botonRef}
          type="button"
          className="voz-boton"
          aria-label={ETIQUETAS[a.estado]}
          aria-pressed={escuchando}
          aria-busy={pensando}
          disabled={pensando}
          onPointerDown={alBajar}
          onPointerUp={alSoltar}
          onPointerLeave={alSoltar}
          onPointerCancel={alSoltar}
          onKeyDown={alTeclear}
          onClick={(e) => e.preventDefault()}
        >
          <span className="voz-boton__anillo" aria-hidden="true" />
          {pensando ? <span className="voz-boton__spinner" aria-hidden="true" /> : <IconoMicrofono />}
        </button>
        <span className="voz-dock__etiqueta" aria-hidden="true">
          {escuchando ? (
            <>
              <span className="voz-dock__punto" />
              {reloj(segundos)}
              <span className="voz-dock__max"> / {reloj(MAXIMO_SEGUNDOS)}</span>
            </>
          ) : (
            ETIQUETAS[a.estado]
          )}
        </span>
      </div>
    </>
  )
}
