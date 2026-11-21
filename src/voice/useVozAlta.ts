import { useCallback, useEffect, useRef, useState } from 'react'

const CLAVE = 'asistente.vozAlta'

function leerPreferencia(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== 'no'
  } catch {
    return true
  }
}

function soportado(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Prefiere una voz rioplatense; si no hay, cualquier voz en castellano. */
function elegirVoz(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices()
  return (
    voces.find((v) => v.lang.toLowerCase() === 'es-ar') ??
    voces.find((v) => v.lang.toLowerCase().startsWith('es-') && v.localService) ??
    voces.find((v) => v.lang.toLowerCase().startsWith('es')) ??
    null
  )
}

/**
 * Lee las respuestas en voz alta con la voz del navegador (gratis, sin claves).
 * La preferencia se recuerda en este navegador.
 */
export function useVozAlta() {
  const disponible = soportado()
  const [activa, setActiva] = useState(() => disponible && leerPreferencia())
  const activaRef = useRef(activa)
  useEffect(() => {
    activaRef.current = activa
  })

  const callar = useCallback(() => {
    if (soportado()) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const hablar = useCallback(
    (texto: string) => {
      if (!soportado() || !activaRef.current || !texto.trim()) {
        return
      }
      callar()
      const frase = new SpeechSynthesisUtterance(texto)
      const voz = elegirVoz()
      if (voz) {
        frase.voice = voz
      }
      frase.lang = voz?.lang ?? 'es-AR'
      window.speechSynthesis.speak(frase)
    },
    [callar],
  )

  const alternar = useCallback(() => {
    setActiva((antes) => {
      const ahora = !antes
      try {
        localStorage.setItem(CLAVE, ahora ? 'si' : 'no')
      } catch {
        // Sin almacenamiento: la preferencia dura hasta recargar.
      }
      if (!ahora) {
        callar()
      }
      return ahora
    })
  }, [callar])

  // Algunos navegadores cargan las voces tarde; pedirlas una vez las deja listas.
  useEffect(() => {
    if (disponible) {
      window.speechSynthesis.getVoices()
    }
    return callar
  }, [disponible, callar])

  return { disponible, activa, alternar, hablar, callar }
}
