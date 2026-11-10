# EduPlatform — Frontend de gestión de cursos

Aplicación React + TypeScript para una plataforma e-learning con tres roles
(estudiante, instructor y administrador). Consume la API REST del backend Spring del
repositorio `pm2026-pergamino-grupo-x` (`demo/`).

## Requisitos

- Node.js 20+ y npm.
- Backend Spring corriendo en `http://localhost:8080` con PostgreSQL accesible.
- El backend **no configura CORS**; por eso el front usa el proxy `/api` de Vite en desarrollo.

## Instalación y ejecución

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173` y proxya `/api` hacia `http://localhost:8080`.

```bash
npm run build     # tsc -b + build de producción
npm run preview   # sirve el build (con el mismo proxy)
npm run lint      # oxlint
```

## Docker

La imagen es multi-stage (build con Node, runtime con nginx). nginx sirve la SPA y proxya
`/api` al backend, por lo que no hace falta CORS.

Requisitos: Docker instalado y el backend Spring corriendo en el puerto `8080`.

### 1. Construir la imagen

```bash
docker build -t elearning-front .
```

### 2. Ejecutar el contenedor

**Linux** (el backend corre en el host):

```bash
docker run -d --name elearning-front \
  -p 8081:80 \
  --add-host=host.docker.internal:host-gateway \
  -e API_UPSTREAM=http://host.docker.internal:8080 \
  elearning-front
```

**macOS / Windows con Docker Desktop** (`host.docker.internal` ya resuelve al host):

```bash
docker run -d --name elearning-front \
  -p 8081:80 \
  -e API_UPSTREAM=http://host.docker.internal:8080 \
  elearning-front
```

**Linux alternativo con red del host**:

```bash
docker run -d --name elearning-front \
  --network host \
  -e API_UPSTREAM=http://localhost:8080 \
  elearning-front
```

La app queda disponible en `http://localhost:8081`. Se usa `8081` para no chocar con el
backend en `8080`; podés cambiarlo con `-p <puerto>:80`.

### 3. Verificar y administrar

```bash
docker ps                                  # ver el contenedor y su estado de salud
docker logs -f elearning-front             # logs de nginx
curl http://localhost:8081/                # SPA (HTML)
curl http://localhost:8081/api/courses     # proxy hacia el backend
docker stop elearning-front                # detener
docker rm elearning-front                  # eliminar
```

Si el backend está en otro host o puerto, cambiá `API_UPSTREAM`, por ejemplo:

```bash
docker run -d --name elearning-front -p 8081:80 \
  -e API_UPSTREAM=http://192.168.1.50:8080 \
  elearning-front
```

### Variables

| Variable | Default | Descripción |
| --- | --- | --- |
| `API_UPSTREAM` | `http://host.docker.internal:8080` | Origen del backend para el proxy `/api`. Se resuelve al iniciar el contenedor. |
| `VITE_API_URL` | `/api` | Se puede sobreescribir en build con `--build-arg VITE_API_URL=...`; si se usa una URL absoluta, el backend debe habilitar CORS. |

## Variables de entorno

Copiá `.env.example` a `.env` si necesitás cambiar valores:

| Variable | Default | Descripción |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base de la API. Ruta relativa para usar el proxy de Vite. |
| `VITE_AUTH_ENDPOINT` | *(vacío)* | Ruta de login real (ej. `/auth/login`). Si se define, se usa en lugar del modo demo. |

Si apuntás `VITE_API_URL` directo a `http://localhost:8080/api`, el navegador bloqueará las
requests por CORS hasta que el backend lo habilite. En producción hace falta CORS o un proxy
inverso equivalente.

## Autenticación (modo demo)

El backend actual no tiene login general: no hay Spring Security, no protege `/api/**` y solo
existe un login parcial de instructores en `POST /instructor/auth` (devuelve un JWT sin datos
del usuario). Por eso:

1. El front pide `GET /administrators`, `GET /instructors` y `GET /students`.
2. Busca el email ingresado y deduce el rol según la tabla donde aparece.
3. Guarda `{ token, user }` en `localStorage`.
4. **La contraseña no se verifica** en modo demo (el backend nunca devuelve hashes).

Usuarios de ejemplo detectados en la base (cualquier contraseña no vacía funciona en modo demo):

| Rol | Email |
| --- | --- |
| Administrador | `arothamel@comunidad.unnoba.edu.ar` |
| Instructor | `laura.gomez@ejemplo.com` |
| Estudiante | `ana@ejemplo.com` |

El registro público de estudiantes (`POST /students`) sí crea la cuenta real y luego inicia
sesión automáticamente.

## Estructura

```
src/
├── api/            # cliente fetch + una función por recurso
│   ├── client.ts   # wrapper, token, errores y mapeo de status
│   ├── auth.ts     # login (demo o VITE_AUTH_ENDPOINT)
│   ├── courses.ts
│   ├── enrollments.ts
│   ├── approvals.ts
│   ├── instructors.ts
│   ├── students.ts
│   ├── administrators.ts
│   └── specialties.ts
├── auth/           # AuthContext, ProtectedRoute, home por rol
├── components/     # Layout/navbar, modales, toasts, badges, estados
├── pages/
│   ├── student/    # catálogo, detalle, mis cursos
│   ├── instructor/ # cursos, formulario, solicitudes, inscriptos, recaudación
│   └── admin/      # solicitudes, cursos, instructores, administradores, recaudación
├── types/          # tipos del dominio
└── utils/          # formatos es-AR, reglas de inscripción, hook de carga
```

## Funcionalidades por rol

### Estudiante

- Registro y login.
- Catálogo de cursos `PUBLISHED` con búsqueda por título y filtro por especialidad.
- Detalle con fechas, cupo, precio e instructor.
- Inscripción deshabilitada con motivo cuando el curso no está publicado, ya comenzó, no tiene
  cupo o ya está inscripto.
- "Mis cursos" ordenado por fecha de inscripción descendente, con precio final abonado.

### Instructor

- "Mis cursos" (solo los propios) con badge de estado.
- Crear/editar/eliminar únicamente en `DRAFT`, con validación de fechas, cupo y precio.
- Solicitar aprobación con comentario opcional.
- "Mis solicitudes" con fechas, estado y comentarios.
- Inscriptos por curso (nombre, apellido, DNI, email, fecha de inscripción).
- Recaudación total (valor del backend) y desglose estimado por curso (65 % × precio base × inscriptos).

### Administrador

- Solicitudes pendientes con detalle del curso; aprobar o rechazar (motivo obligatorio en UI).
- Listado global de cursos con filtro por estado y eliminación con confirmación.
- Alta de instructores con asignación de especialidades.
- Alta de administradores.
- Recaudación global (`GET /enrollments/revenue`).

## Reglas y decisiones relevantes

- El backend es la fuente de verdad: el front deshabilita acciones inválidas y muestra el
  `mensaje` devuelto por el servidor.
- Las inscripciones no se cancelan (el backend no lo permite).
- El descuento de fidelidad lo calcula el backend al confirmar; el front no lo estima. Si hay
  una inscripción previa del mismo mes y especialidad, muestra un aviso informativo.
- El precio final abonado se muestra en "Mis cursos" y en el toast posterior a la inscripción.
- Los cupos se calculan con `GET /enrollments` porque no hay endpoint de conteo por curso.
- La recaudación del instructor usa `GET /instructors/{id}/revenue`; el desglose por curso se
  calcula en el front (65 % × precio base × inscriptos) y se aclara en pantalla.

## Suposiciones y discrepancias pendientes

Documentadas en detalle en [`API_CONTRACT.md`](./API_CONTRACT.md). Resumen:

1. **Sin autenticación real**: el login es demo por email; no se valida contraseña. Si el backend
   agrega `POST /auth/login`, definir `VITE_AUTH_ENDPOINT`.
2. **Sin CORS**: se resuelve con proxy de Vite en desarrollo; producción requiere CORS/proxy.
3. **Especialidades del instructor no expuestas**: el formulario de curso muestra todas las
   especialidades y el backend rechaza si no pertenece al instructor.
4. **Instructores sin estado pendiente**: no existe `PATCH /instructors/{id}/approve`; el alta es
   directa y no se muestra flujo de aprobación.
5. **Filtros de cursos**: el backend solo filtra por `studentId`; estado y especialidad se
   filtran en el front.
6. **Sin endpoints "me"**: se usan los ids de la sesión (`instructorId`, `studentId`,
   `administratorId`) contra los listados generales.
7. **Conteo de inscriptos**: se obtiene del listado completo de inscripciones.
8. **Endpoints de aprobación**: son `POST .../approve` y `POST .../reject`, no `PATCH`.
