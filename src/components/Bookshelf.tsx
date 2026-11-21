import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { coverVars } from '../utils/coverPalette'
import { CourseCover } from './CourseCover'

/*
 * Catálogo completo como estantería: cada curso es un lomo. El libro activo (el que
 * tiene el mouse o el foco) se abre y muestra la tapa; abajo van sus datos y el link.
 */

export interface ShelfItem {
  id: number
  title: string
  kicker: string
  byline?: string
  to: string
  details: ReactNode
}

// Alto del lomo entre 300 y 360 px, fijo para cada curso: la fila no queda pareja.
function spineHeight(id: number) {
  return 300 + ((id * 37) % 61)
}

export function Bookshelf({ items }: { items: ShelfItem[] }) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const active = items.find((item) => item.id === activeId) ?? items[0]

  if (!active) {
    return null
  }

  return (
    <div className="shelf-wrap">
      <ul className="shelf" aria-label="Todos los cursos">
        {items.map((item) => {
          const open = item.id === active.id
          const style = { ...coverVars(item.id), '--spine-h': `${spineHeight(item.id)}px` } as CSSProperties
          return (
            <li key={item.id} className={`shelf__item${open ? ' is-open' : ''}`} style={style}>
              <Link
                to={item.to}
                className="shelf__book"
                aria-label={`${item.title}, ${item.kicker}`}
                onMouseEnter={() => setActiveId(item.id)}
                onFocus={() => setActiveId(item.id)}
              >
                <span className="shelf__spine" aria-hidden="true">
                  <span className="shelf__spine-title">{item.title}</span>
                  <span className="shelf__spine-kicker">{item.kicker}</span>
                  <span className="shelf__spine-mark" />
                </span>
                <span className="shelf__front" aria-hidden="true">
                  <CourseCover seed={item.id} title={item.title} kicker={item.kicker} byline={item.byline} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="shelf__details" aria-live="polite">
        <div>
          <h2 className="shelf__title">{active.title}</h2>
          <p className="muted">
            {active.kicker}
            {active.byline ? `, con ${active.byline}` : ''}
          </p>
        </div>
        {active.details}
        <Link to={active.to} className="button button--primary">
          Ver curso
        </Link>
      </div>
    </div>
  )
}
