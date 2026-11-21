import { useEffect, useState } from 'react'

/**
 * Muestra lo que vas diciendo mientras grabás, con el reconocimiento de voz del navegador
 * (Chrome y Safari). Es solo para verlo en pantalla: el texto que se usa para el pedido es el
 * de Whisper, que llega al soltar. Si el navegador no lo soporta, devuelve siempre ''.
 */

interface Alternativa {
  transcript: string
}
interface Resultado {
  readonly length: number
  readonly isFinal: boolean
  [i: number]: Alternativa
}
interface EventoResultado {
  results: { readonly length: number; [i: number]: Resultado }
}
interface Reconocedor {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((e: EventoResultado) => void) | null
  onerror: (() => void) | null
  start(): void
  abort(): void
}
type ConstructorReconocedor = new () => Reconocedor

function constructor(): ConstructorReconocedor | null {
  if (typeof window === 'undefined') {
    return null
  }
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocedor
    webkitSpeechRecognition?: ConstructorReconocedor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useTextoEnVivo(activo: boolean): string {
  const [texto, setTexto] = useState('')

  useEffect(() => {
    const Clase = constructor()
    if (!activo || !Clase) {
      return
    }
    let reconocedor: Reconocedor | null = new Clase()
    reconocedor.lang = 'es-AR'
    reconocedor.continuous = true
    reconocedor.interimResults = true
    // Al arrancar se borra lo del pedido anterior (se conserva hasta acá para el panel).
    reconocedor.onstart = () => setTexto('')
    reconocedor.onresult = (e) => {
      let armado = ''
      for (let i = 0; i < e.results.length; i++) {
        armado += e.results[i][0]?.transcript ?? ''
      }
      setTexto(armado.trim())
    }
    // Sin permiso, sin red o sin soporte real: simplemente no hay texto en vivo.
    reconocedor.onerror = () => {}
    try {
      reconocedor.start()
    } catch {
      reconocedor = null
    }
    return () => {
      reconocedor?.abort()
    }
  }, [activo])

  return texto
}
