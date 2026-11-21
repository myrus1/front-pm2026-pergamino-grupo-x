import { useRef, type PointerEvent, type ReactNode } from 'react'

/*
 * Escenario del libro en el detalle. En reposo el libro se balancea solo; cuando el
 * mouse pasa por encima, deja de balancearse y se inclina hacia donde está el puntero.
 * Con "reducir movimiento" no hace nada (lo resuelve el CSS).
 */
export function BookStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const stage = ref.current
    if (!stage || event.pointerType === 'touch') {
      return
    }
    const box = stage.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width - 0.5
    const y = (event.clientY - box.top) / box.height - 0.5
    stage.style.setProperty('--tilt-x', x.toFixed(3))
    stage.style.setProperty('--tilt-y', y.toFixed(3))
    stage.classList.add('is-tilting')
  }

  const handleLeave = () => {
    ref.current?.classList.remove('is-tilting')
  }

  return (
    <div ref={ref} className="detail-stage" onPointerMove={handleMove} onPointerLeave={handleLeave}>
      {children}
    </div>
  )
}
