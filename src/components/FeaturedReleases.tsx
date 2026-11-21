import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { CourseCover, Landscape } from './CourseCover'

/*
 * Cursos destacados que se recorren con el scroll. La sección queda fija mientras se
 * scrollea: cada libro entra desde abajo girando, queda al frente y sale por arriba;
 * el paisaje de fondo y la franja de títulos acompañan al libro activo.
 */

export interface FeaturedItem {
  id: number
  title: string
  kicker: string
  byline?: string
  meta: string
  to: string
}

// Cuánto scroll (en altos de pantalla) ocupa cada libro.
const SCREENS_PER_BOOK = 0.9

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function FeaturedReleases({ items }: { items: FeaturedItem[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const titleRefs = useRef<Array<HTMLSpanElement | null>>([])
  const [progress, setProgress] = useState(0)
  const [centers, setCenters] = useState<number[]>([])
  const [stripWidth, setStripWidth] = useState(0)
  const last = items.length - 1

  // Avance del scroll dentro de la sección, de 0 al último libro.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const section = sectionRef.current
      if (!section) {
        return
      }
      const box = section.getBoundingClientRect()
      const travel = section.offsetHeight - window.innerHeight
      const ratio = travel > 0 ? Math.min(Math.max(-box.top / travel, 0), 1) : 0
      const value = ratio * last
      setProgress(prefersReducedMotion() ? Math.round(value) : value)
    }
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [last])

  // Centro de cada título en la franja, para correrla hasta el activo.
  useLayoutEffect(() => {
    const measure = () => {
      setCenters(titleRefs.current.map((node) => (node ? node.offsetLeft + node.offsetWidth / 2 : 0)))
      setStripWidth(stripRef.current?.parentElement?.clientWidth ?? 0)
    }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [items])

  if (items.length === 0) {
    return null
  }

  const active = Math.min(Math.max(Math.round(progress), 0), last)
  const lower = Math.floor(progress)
  const upper = Math.min(lower + 1, last)
  const fraction = progress - lower
  const center = centers.length
    ? (centers[lower] ?? 0) + ((centers[upper] ?? 0) - (centers[lower] ?? 0)) * fraction
    : 0
  const current = items[active]

  return (
    <section
      ref={sectionRef}
      className="featured"
      style={{ height: `${(items.length * SCREENS_PER_BOOK + 1) * 100}vh` }}
      aria-label="Cursos destacados"
    >
      <div className="featured__sticky">
        <p className="featured__label">[ Próximos cursos ]</p>

        <div className="featured__titles" aria-hidden="true">
          <div
            ref={stripRef}
            className="featured__strip"
            style={{ transform: `translateX(${stripWidth / 2 - center}px)` }}
          >
            {items.map((item, index) => (
              <span
                key={item.id}
                ref={(node) => {
                  titleRefs.current[index] = node
                }}
                className={`featured__title${index === active ? ' is-active' : ''}`}
              >
                {item.title}
                <small>{item.kicker}</small>
              </span>
            ))}
          </div>
        </div>

        <div className="featured__stage">
          {items.map((item, index) => {
            const offset = index - progress
            if (Math.abs(offset) > 1.2) {
              return null
            }
            return (
              <div
                key={item.id}
                className="featured__backdrop"
                style={{ opacity: Math.max(0, 1 - Math.abs(offset) * 1.4) }}
              >
                <Landscape seed={item.id} />
              </div>
            )
          })}

          {items.map((item, index) => {
            const offset = index - progress
            if (Math.abs(offset) > 1.6) {
              return null
            }
            const style = {
              '--offset': offset.toFixed(4),
              zIndex: 10 - Math.round(Math.abs(offset) * 4),
            } as CSSProperties
            return (
              <Link
                key={item.id}
                to={item.to}
                className="featured__book"
                style={style}
                tabIndex={index === active ? 0 : -1}
                aria-hidden={index === active ? undefined : true}
                aria-label={`Ver ${item.title}`}
              >
                <CourseCover variant="book" seed={item.id} title={item.title} kicker={item.kicker} byline={item.byline} />
              </Link>
            )
          })}
        </div>

        <div className="featured__bar">
          <span>
            <span aria-hidden="true">[+]</span> {current.title}
            <span className="featured__meta">{current.meta}</span>
          </span>
          <span className="featured__count" aria-hidden="true">
            {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          <Link to={current.to} className="featured__more">
            Ver curso <span aria-hidden="true">[+]</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
