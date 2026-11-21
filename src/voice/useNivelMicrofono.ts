import { useEffect, type RefObject } from 'react'

/**
 * Mide el volumen del micrófono mientras hay `stream` y lo escribe en la variable CSS `--nivel`
 * (0 a 1) del elemento. Escribe directo en el estilo para no re-renderizar 60 veces por segundo.
 */
export function useNivelMicrofono(stream: MediaStream | null, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const elemento = ref.current
    if (!stream || !elemento || typeof AudioContext === 'undefined') {
      return
    }
    const contexto = new AudioContext()
    const analizador = contexto.createAnalyser()
    analizador.fftSize = 512
    contexto.createMediaStreamSource(stream).connect(analizador)
    const muestras = new Uint8Array(analizador.fftSize)

    let suavizado = 0
    let cuadro = 0
    const medir = () => {
      analizador.getByteTimeDomainData(muestras)
      let suma = 0
      for (const m of muestras) {
        const v = (m - 128) / 128
        suma += v * v
      }
      // La voz normal da un RMS de 0,02 a 0,2: se amplifica y se suaviza para que no tiemble.
      const nivel = Math.min(1, Math.sqrt(suma / muestras.length) * 5)
      suavizado = suavizado * 0.7 + nivel * 0.3
      elemento.style.setProperty('--nivel', suavizado.toFixed(3))
      cuadro = requestAnimationFrame(medir)
    }
    cuadro = requestAnimationFrame(medir)

    return () => {
      cancelAnimationFrame(cuadro)
      elemento.style.removeProperty('--nivel')
      void contexto.close()
    }
  }, [stream, ref])
}
