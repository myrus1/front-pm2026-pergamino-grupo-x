import type { Role } from '../types/domain'
import type { PantallaAsistente } from '../types/asistente'

/**
 * Traduce la pantalla que pide el asistente a una ruta del front. Cada rol solo tiene las
 * suyas: si llega otra (o falta el id), no se navega.
 */
type Ruta = string | ((id: number) => string)

const PUBLICAS: Record<string, Ruta> = {
  ingresar: '/login',
  registrarse: '/register',
}

const POR_ROL: Record<Role, Record<string, Ruta>> = {
  STUDENT: {
    catalogo: '/student/catalog',
    curso: (id) => `/student/courses/${id}`,
    mis_inscripciones: '/student/my-courses',
  },
  INSTRUCTOR: {
    mis_cursos: '/instructor/courses',
    nuevo_curso: '/instructor/courses/new',
    editar_curso: (id) => `/instructor/courses/${id}/edit`,
    alumnos_curso: (id) => `/instructor/courses/${id}/students`,
    solicitudes: '/instructor/requests',
    recaudacion: '/instructor/revenue',
  },
  ADMIN: {
    solicitudes: '/admin/requests',
    cursos: '/admin/courses',
    instructores: '/admin/instructors',
    administradores: '/admin/administrators',
    recaudacion: '/admin/revenue',
  },
}

export function rutaDePantalla(pantalla: PantallaAsistente, rol: Role | null): string | null {
  const ruta = (rol ? POR_ROL[rol] : PUBLICAS)[pantalla.nombre]
  if (!ruta) {
    return null
  }
  if (typeof ruta === 'string') {
    return ruta
  }
  return Number.isInteger(pantalla.id) && pantalla.id! > 0 ? ruta(pantalla.id!) : null
}
