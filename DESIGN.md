# DESIGN.md · PM2026

Dirección **editorial**, inspirada en el lenguaje de Stripe Press (sin copiarlo): fondo negro
cálido, tinta hueso, títulos en serif, interfaz en mono y **cada curso es un libro** con su
propia portada. Lo memorable está en las portadas; todo lo demás es sobrio.

Los valores viven como variables en `src/index.css` (`:root`). Las páginas usan los nombres,
nunca valores sueltos.

## Color

| Token            | Valor     | Rol                                                      |
| ---------------- | --------- | -------------------------------------------------------- |
| `--paper`        | `#0e0e0c` | Fondo de la app                                          |
| `--paper-raised` | `#161614` | Paneles, modales, avisos, fila con hover                 |
| `--paper-sunk`   | `#1c1c19` | Ayudas, código, opción marcada                           |
| `--ink`          | `#eceae3` | Títulos, texto activo, botón primario, foco              |
| `--text`         | `#d9d6cc` | Texto de lectura                                         |
| `--muted`        | `#9a978d` | Etiquetas, metadatos, nav inactivo (6,9:1 sobre el fondo) |
| `--faint`        | `#6e6b63` | Solo decoración y placeholders                           |
| `--rule`         | `#2e2e2a` | Filetes y bordes                                         |
| `--rule-strong`  | `#4a4842` | Bordes de inputs y botones secundarios                   |
| `--ok`           | `#8fbf8a` | Publicado, aprobado, con cupo                            |
| `--wait`         | `#e0b654` | Pendiente de aprobación                                  |
| `--info`         | `#9db7e0` | Solicitud enviada                                        |
| `--danger`       | `#f08a76` | Errores y rechazado (texto)                              |
| `--danger-fill`  | `#b8432f` | Botón de acción destructiva                              |

No hay color de marca aparte de la tinta: la acción principal es hueso sobre negro.
Los nombres viejos (`--primary`, `--surface`, `--white`, `--border`…) siguen existiendo y apuntan
a estos valores, para que estilos de otras ramas (el asistente por voz) no se rompan.

**Portadas:** ocho pares papel/tinta (`CourseCover.tsx`): salvia `#3F5B4A`, ladrillo `#8C4A32`,
azul `#2F4A6B`, trigo `#B08A2E`, ciruela `#5C4D6E`, oliva `#6B7344`, lino `#C9C2A8`, piedra `#D7D3C8`.

## Tipografía

| Familia          | Uso                                                              |
| ---------------- | ---------------------------------------------------------------- |
| Instrument Serif | `h1`, `h2`, títulos de portada, precios grandes, números de resumen |
| Geist            | Texto de lectura, formularios, celdas de tabla                   |
| Geist Mono       | Nav, botones, etiquetas de campo, encabezados de tabla, fechas y montos chicos |

Escala: 4rem (h1) · 3rem (precio) · 2.75rem (resumen) · 1.85rem (h2) · 1.0625rem (descripción)
· 1rem (cuerpo) · 0.8125rem (mono de interfaz) · 0.6875rem (mono de etiquetas).
El mono va en mayúsculas con 0.04–0.08em de tracking; el resto, en minúsculas normales.
El ítem activo del nav va entre `[ ]`.

## Espaciado y forma

- Escala de 4 px (`0.25rem` en adelante). Contenido a 1200 px, márgenes laterales de 1.5rem
  (1rem en móvil).
- Radios casi rectos: 2 / 3 / 4 px. Los libros tienen el lomo apenas redondeado.
- Sin sombras en reposo. Una sola sombra (`--shadow-md`) para modales, avisos y libros levantados.
- Filetes: 1 px `--ink` bajo la barra superior y sobre las tablas; 1 px `--rule` en el resto.

## Componentes

- **Botones:** mono en mayúsculas. Primario hueso con texto negro, secundario con borde,
  destructivo ladrillo, `quiet` subrayado. Mínimo 44 px de alto.
- **Campos:** solo línea inferior; con foco la línea pasa a tinta. Los `textarea` llevan borde completo.
- **Portada (`CourseCover`):** paisaje de llanura generado a partir del id del curso (sol,
  lomas y surcos). El mismo curso siempre tiene la misma portada. Variantes: `card`, `book`, `thumb`.
- **Destacados (`FeaturedReleases`):** arriba del catálogo, los próximos cursos se recorren con el
  scroll. La sección queda fija, cada libro entra desde abajo girando y sale por arriba, el paisaje
  de fondo cambia con él y la franja de títulos avanza sincronizada. Abajo, título, fecha y link.
- **Estantería (`Bookshelf`):** el catálogo completo son lomos en un estante. El libro con el
  mouse o el foco se abre y muestra la tapa; al costado van fechas, precio, cupo y "Ver curso".
- **Detalle:** el libro en 3D, con lomo y hojas, sobre un escenario oscuro y balanceándose despacio.
- **Estados:** etiquetas con borde del color del estado, sin fondo.
- **Tablas:** encabezado en mono, filetes horizontales, montos alineados a la derecha.

## Movimiento

- Cada pantalla entra con un fundido corto; en el catálogo, además, los libros aparecen uno tras otro.
- Ingreso y registro: el sol del paisaje sube y los surcos se dibujan, una sola vez.
- Movimiento ligado al scroll en los destacados del catálogo. Movimiento continuo en el libro del detalle,
  que con el mouse encima deja de balancearse y sigue al puntero (`BookStage`).
- Portadas vivas: el sol de cada portada sube y baja a su ritmo.
- Hover: la portada gira y la cruza un brillo; la miniatura de una fila se asoma; el nav subraya.
- Con `prefers-reduced-motion` se apaga todo y el paisaje aparece completo.

## Fondo

Es la llanura de las portadas a escala de pantalla, y se mueve (`.ambient` en `index.html`):
una luz cálida cruza el cielo en 70 s, otra verdosa sube desde abajo, y el piso es un plano de
surcos en perspectiva que avanza hacia quien mira. Encima hay un grano de papel fijo al 6 %.
Todo anima con `transform`, así que no recalcula el layout. Con "reducir movimiento" queda quieto.
La barra superior es translúcida con desenfoque.
