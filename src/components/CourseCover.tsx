import { useId, type CSSProperties } from 'react'
import { coverPalette } from '../utils/coverPalette'

/*
 * Portada generada para un curso. No hay imágenes en el backend, así que cada curso
 * tiene un "libro" propio: un paisaje de llanura (cielo, sol, lomas y surcos) que sale
 * de su id. El mismo curso siempre tiene la misma portada.
 */

// Generador pseudoaleatorio con semilla (mulberry32): mismo id, misma portada.
function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}


// Una loma suave de lado a lado, cerrada hacia abajo.
function hillPath(random: () => number, baseY: number, amplitude: number) {
  const points = 6
  const step = 300 / points
  const ys = Array.from({ length: points + 1 }, () => baseY - random() * amplitude)
  let d = `M0 ${ys[0].toFixed(1)}`
  for (let index = 1; index <= points; index += 1) {
    const x = index * step
    const controlX = x - step / 2
    d += ` Q${controlX.toFixed(1)} ${ys[index - 1].toFixed(1)} ${x.toFixed(1)} ${((ys[index - 1] + ys[index]) / 2).toFixed(1)}`
  }
  return `${d} L300 400 L0 400 Z`
}

function CoverArt({ seed, align = 'xMidYMid' }: { seed: number; align?: string }) {
  const random = seeded(seed * 9973 + 17)
  const { ink } = coverPalette(seed)
  const horizon = 225 + random() * 40
  const sunX = 50 + random() * 200
  const sunY = 70 + random() * 70
  const sunR = 16 + random() * 22
  const ringed = random() > 0.5
  const vanishX = 60 + random() * 180
  const furrows = 9 + Math.floor(random() * 6)

  // Los ids de los filtros tienen que ser únicos en la página.
  const uid = useId().replace(/:/g, '')
  const sky = `sky-${uid}`

  return (
    <svg className="cover__art" viewBox="0 0 300 400" preserveAspectRatio={`${align} slice`} aria-hidden="true">
      {/*
        Sin filtros SVG (feTurbulence): en Safari y en PCs sin mucha GPU se recalculaban en
        cada cuadro de scroll, en cada portada, y la página iba en cámara lenta. El grano lo
        pone la textura fija de toda la app (body::after).
      */}
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ink} stopOpacity="0" />
          <stop offset="1" stopColor={ink} stopOpacity="0.14" />
        </linearGradient>
      </defs>
      <rect width="300" height={horizon + 14} fill={`url(#${sky})`} />
      {ringed ? (
        <circle className="art-sun" cx={sunX} cy={sunY} r={sunR} fill="none" stroke={ink} strokeOpacity="0.55" strokeWidth="1.5" />
      ) : (
        <circle className="art-sun" cx={sunX} cy={sunY} r={sunR} fill={ink} fillOpacity="0.2" />
      )}
      <g className="art-land">
        <path d={hillPath(random, horizon - 10, 46)} fill={ink} fillOpacity="0.1" />
        <path d={hillPath(random, horizon + 12, 30)} fill={ink} fillOpacity="0.16" />
      </g>
      <g className="art-furrows" stroke={ink} strokeOpacity="0.3" strokeWidth="1">
        {Array.from({ length: furrows }, (_, index) => {
          const x = -120 + (index * 540) / (furrows - 1)
          return <line key={index} pathLength={1} x1={vanishX} y1={horizon + 14} x2={x} y2={400} />
        })}
      </g>
      <line x1="0" y1={horizon + 14} x2="300" y2={horizon + 14} stroke={ink} strokeOpacity="0.45" strokeWidth="1" />
    </svg>
  )
}

/** El mismo paisaje, sin texto, para llenar un panel (ingreso y registro). */
export function Landscape({ seed, align }: { seed: number; align?: string }) {
  const { paper, ink } = coverPalette(seed)
  return (
    <span className="landscape" style={{ '--cover-paper': paper, '--cover-ink': ink } as CSSProperties}>
      <CoverArt seed={seed} align={align} />
    </span>
  )
}

interface CourseCoverProps {
  seed: number
  title: string
  kicker?: string
  byline?: string
  /** `book` le agrega lomo y volumen; `thumb` es la miniatura de las tablas. */
  variant?: 'card' | 'book' | 'thumb'
}

export function CourseCover({ seed, title, kicker, byline, variant = 'card' }: CourseCoverProps) {
  const { paper, ink } = coverPalette(seed)
  const style = { '--cover-paper': paper, '--cover-ink': ink } as CSSProperties

  if (variant === 'thumb') {
    return (
      <span className="cover cover--thumb" style={style} aria-hidden="true">
        <CoverArt seed={seed} />
      </span>
    )
  }

  const cover = (
    <span className={`cover cover--${variant}`} style={style}>
      <CoverArt seed={seed} />
      <span className="cover__text">
        {kicker && <span className="cover__kicker">{kicker}</span>}
        <span className="cover__title">{title}</span>
        {byline && <span className="cover__byline">{byline}</span>}
      </span>
    </span>
  )

  if (variant === 'book') {
    return (
      <span className="book" style={style}>
        {cover}
        <span className="book__spine" aria-hidden="true" />
        <span className="book__pages" aria-hidden="true" />
      </span>
    )
  }

  return cover
}
