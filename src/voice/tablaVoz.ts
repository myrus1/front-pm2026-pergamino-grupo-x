import { formatCurrency, formatDate } from '../utils/format'
import { APPROVAL_STATUS_LABELS, COURSE_STATUS_LABELS } from '../utils/labels'

/**
 * Convierte las filas crudas de la API en una tabla legible: columnas en castellano,
 * sin ids, con precios en pesos y fechas dd/mm/aaaa.
 */

type Formato = 'texto' | 'precio' | 'fecha' | 'estado'

interface Columna {
  clave: string
  titulo: string
  formato: Formato
}

// Orden de aparición. Lo que no está acá se muestra al final con su nombre "humanizado".
const CONOCIDAS: Columna[] = [
  { clave: 'title', titulo: 'Curso', formato: 'texto' },
  { clave: 'courseTitle', titulo: 'Curso', formato: 'texto' },
  { clave: 'firstName', titulo: 'Nombre', formato: 'texto' },
  { clave: 'lastName', titulo: 'Apellido', formato: 'texto' },
  { clave: 'name', titulo: 'Nombre', formato: 'texto' },
  { clave: 'nombre', titulo: 'Nombre', formato: 'texto' },
  { clave: 'email', titulo: 'Email', formato: 'texto' },
  { clave: 'especialidad', titulo: 'Especialidad', formato: 'texto' },
  { clave: 'specialtyName', titulo: 'Especialidad', formato: 'texto' },
  { clave: 'startDate', titulo: 'Inicio', formato: 'fecha' },
  { clave: 'endDate', titulo: 'Fin', formato: 'fecha' },
  { clave: 'enrollmentDate', titulo: 'Inscripción', formato: 'fecha' },
  { clave: 'enrolledAt', titulo: 'Inscripción', formato: 'fecha' },
  { clave: 'basePrice', titulo: 'Precio', formato: 'precio' },
  { clave: 'finalPrice', titulo: 'Precio final', formato: 'precio' },
  { clave: 'price', titulo: 'Precio', formato: 'precio' },
  { clave: 'amount', titulo: 'Monto', formato: 'precio' },
  { clave: 'total', titulo: 'Total', formato: 'precio' },
  { clave: 'totalRevenue', titulo: 'Recaudado', formato: 'precio' },
  { clave: 'revenue', titulo: 'Recaudado', formato: 'precio' },
  { clave: 'maxCapacity', titulo: 'Cupo', formato: 'texto' },
  { clave: 'enrolledCount', titulo: 'Inscriptos', formato: 'texto' },
  { clave: 'status', titulo: 'Estado', formato: 'estado' },
]

// Campos que no le dicen nada a una persona en una tabla chica.
const OCULTAS = new Set(['description', 'password'])
const MAXIMO_COLUMNAS = 5

function esId(clave: string): boolean {
  return clave === 'id' || /Id$/.test(clave) || /_id$/.test(clave)
}

function humanizar(clave: string): string {
  const separado = clave.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return separado.charAt(0).toUpperCase() + separado.slice(1)
}

function formatear(valor: unknown, formato: Formato): string {
  if (valor === null || valor === undefined || valor === '') {
    return '—'
  }
  if (formato === 'precio' && (typeof valor === 'number' || typeof valor === 'string')) {
    return formatCurrency(valor)
  }
  if (formato === 'fecha' && typeof valor === 'string') {
    return formatDate(valor)
  }
  if (formato === 'estado' && typeof valor === 'string') {
    const etiquetas: Record<string, string> = { ...COURSE_STATUS_LABELS, ...APPROVAL_STATUS_LABELS }
    return etiquetas[valor] ?? valor
  }
  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No'
  }
  if (Array.isArray(valor)) {
    return String(valor.length)
  }
  if (typeof valor === 'object') {
    const obj = valor as Record<string, unknown>
    const nombre = obj.nombre ?? obj.name ?? obj.title
    return typeof nombre === 'string' ? nombre : '…'
  }
  return String(valor)
}

export interface TablaVoz {
  columnas: { clave: string; titulo: string }[]
  filas: string[][]
}

export function armarTabla(filas: Record<string, unknown>[]): TablaVoz {
  const presentes = new Set(filas.flatMap((f) => Object.keys(f)))
  const elegidas: Columna[] = []
  const titulos = new Set<string>()
  const agregar = (c: Columna) => {
    // Dos claves con el mismo título (title y courseTitle): queda la primera.
    if (elegidas.length < MAXIMO_COLUMNAS && !titulos.has(c.titulo)) {
      elegidas.push(c)
      titulos.add(c.titulo)
    }
  }
  CONOCIDAS.filter((c) => presentes.has(c.clave)).forEach(agregar)
  for (const clave of presentes) {
    if (!esId(clave) && !OCULTAS.has(clave) && !CONOCIDAS.some((c) => c.clave === clave)) {
      agregar({ clave, titulo: humanizar(clave), formato: 'texto' })
    }
  }
  return {
    columnas: elegidas.map(({ clave, titulo }) => ({ clave, titulo })),
    filas: filas.map((f) => elegidas.map((c) => formatear(f[c.clave], c.formato))),
  }
}
