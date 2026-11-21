# EduPlatform — Frontend de gestión de cursos

Aplicación React + TypeScript para una plataforma e-learning con tres roles
(estudiante, instructor y administrador). Consume la API REST del backend Spring del
repositorio `pm2026-pergamino-grupo-x` (carpeta `backend/`).

## Requisitos

- Node.js 20+ y npm.
- Backend Spring corriendo en `http://localhost:8080` con PostgreSQL accesible.
- En desarrollo el front usa el proxy `/api` de Vite, así front y API comparten origen. El
  backend también acepta pedidos directos de los orígenes que figuran en su variable
  `CORS_ALLOWED_ORIGINS`.

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
| `API_UPSTREAM` | `http://host.docker.internal:8080` | Origen del backend para el proxy `/api`. Se resuelve en tiempo de request. |
| `PORT` | `80` | Puerto donde escucha nginx. En Railway se toma del valor inyectado por la plataforma. |
| `VITE_API_URL` | `/api` | Se puede sobreescribir en build con `--build-arg VITE_API_URL=...`; si se usa una URL absoluta, el origen del front tiene que estar en `CORS_ALLOWED_ORIGINS` del backend. |
| `VITE_ASISTENTE_URL` | _(vacío)_ | URL pública del asistente de voz (ej. `https://asistente.up.railway.app`, sin barra final). Es de build: `--build-arg VITE_ASISTENTE_URL=...`. Vacía, el botón de voz no aparece. |

## Despliegue en Railway

Railway construye con el `Dockerfile` del repositorio y ejecuta nginx en el puerto que
inyecta en `PORT`.

1. Conectá el repositorio y desplegá la rama `main`.
2. En **Settings → Build**, verificá que el builder sea **Dockerfile**.
3. En **Variables** del servicio del front agregá `API_UPSTREAM`, según cómo expongas el backend:

   ```
   # Red privada (recomendado si el backend está en el mismo proyecto/environment)
   API_UPSTREAM=http://<servicio-backend>.railway.internal:<puerto>

   # Red pública
   API_UPSTREAM=https://<url-publica-del-backend>
   ```

   Siempre con esquema (`http://` o `https://`) y sin `/api` al final: nginx conserva el
   path original (`/api/...`).

No hace falta definir `VITE_API_URL` en Railway: el build ya usa `/api` por defecto, de modo
que el navegador pega contra el mismo origen y nginx hace el proxy al backend.

Para mostrar el asistente de voz, agregá en **Variables** del front `VITE_ASISTENTE_URL` con
la URL pública del servicio del asistente (`https://...`, sin barra final). Railway se la pasa
al build por el `ARG` del `Dockerfile`; como Vite la incrusta al compilar, cambiarla exige
redesplegar el front. En el asistente, `ALLOWED_ORIGINS` tiene que ser el origen exacto del front.

## Variables de entorno

Copiá `.env.example` a `.env` si necesitás cambiar valores:

| Variable | Default | Descripción |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base de la API. Ruta relativa para usar el proxy de Vite. |
| `VITE_ASISTENTE_URL` | _(vacío)_ | URL del servicio del asistente de voz (ej. `http://localhost:8000`). Vacía, no se muestra el botón de voz. |

El login único (`/api/auth/token`) va por el proxy de `/api`. Los logins viejos
(`/student/auth`, `/instructor/auth` y `/administrator/auth`) viven fuera de `/api`; Vite y
nginx los proxyean con rutas exactas.

Si apuntás `VITE_API_URL` directo a `http://localhost:8080/api`, agregá el origen del front
(por ejemplo `http://localhost:5173`) a `CORS_ALLOWED_ORIGINS` en el `.env` del backend.

## Autenticación

La autenticación es por JWT. El front no pregunta el tipo de usuario:

1. Envía email y contraseña a `POST /api/auth/token` (login único, issue #27 del backend).
   Responde `{ accessToken, tokenType, expiresIn, role }`.
2. Si el backend responde `404` (todavía no tiene ese endpoint), usa los logins viejos en
   orden: `POST /student/auth`, `POST /instructor/auth` y `POST /administrator/auth`. El
   primero que responde `200` devuelve `{ "token": "Bearer <jwt>" }`. El `404` se recuerda
   hasta recargar la página, para no repetir ese pedido en cada login.

En los dos casos un `401` significa credenciales inválidas, y el mensaje no dice si falló el
email o la contraseña.

El JWT contiene `sub` (email), `rol` y `userId`. El front acepta el rol en español
(`ALUMNO | INSTRUCTOR | ADMINISTRADOR`, como lo manda hoy el claim) y en inglés
(`STUDENT | INSTRUCTOR | ADMINISTRATOR`, como viene `role` en `/api/auth/token`). Con esos
datos arma la sesión (`STUDENT | INSTRUCTOR | ADMIN`) y completa nombre y apellido:

| Rol | Origen del nombre |
| --- | --- |
| Instructor | `GET /api/instructors/{id}` |
| Administrador | `GET /api/administrators/{id}` con su propio token |
| Alumno | Sin endpoint propio: la barra muestra el email |

El token se guarda **sin** el prefijo `Bearer` en `localStorage` (clave
`elearning.session.v2`) y se adjunta como `Authorization: Bearer <jwt>` en cada request.
Si un pedido con token recibe `401`, o el token guardado ya venció al abrir la app, la sesión
se limpia y el login muestra "Tu sesión venció. Ingresá de nuevo para continuar." Al
ingresar se vuelve a la página donde estaba el usuario.

El registro público de estudiantes (`POST /students`) crea la cuenta real y luego inicia
sesión automáticamente.

## Errores de la API

`src/api/client.ts` convierte cada respuesta de error en un `ApiError` con:

- `status`: el código HTTP.
- `message`: el `detail` del formato estándar (`ProblemDetail`, issue #25 del backend) o, con
  el backend anterior, el `mensaje`. Para errores `5xx` y fallas técnicas (`internal.error`,
  `http.not-found`, `request.malformed`, etc.) usa un texto propio por código de estado.
- `code`: la clave estable del error (`data.integrity.conflict`, `authentication.failed`…).
- `fieldErrors`: los mensajes de `errors[]` por campo, en los errores de validación (`400`).

Los formularios (registro, alta de instructor, alta de administrador y curso) validan todos
los campos antes de enviar y muestran cada error debajo de su campo, con `aria-invalid` y
`aria-describedby`. Si el backend responde `errors[]`, marca esos mismos campos: los nombres
del formulario coinciden con los del `Request` del backend. Cuando hay más de un campo con
error, arriba del botón aparece "Revisá los N campos marcados." El hook
`src/utils/useFormErrors.ts` y el componente `src/components/FieldError.tsx` concentran este
comportamiento.

## Estructura

```
src/
├── api/            # cliente fetch + una función por recurso
│   ├── client.ts   # wrapper, token, ApiError (detail, code, errores por campo)
│   ├── auth.ts     # login único con respaldo a los logins viejos; decodifica el JWT
│   ├── courses.ts
│   ├── enrollments.ts
│   ├── approvals.ts
│   ├── instructors.ts
│   ├── students.ts
│   ├── administrators.ts
│   └── specialties.ts
├── auth/           # AuthContext, ProtectedRoute, home por rol
├── components/     # Layout/navbar, modales, toasts, badges, estados, errores de campo
├── pages/
│   ├── student/    # catálogo, detalle, mis cursos
│   ├── instructor/ # cursos, formulario, solicitudes, inscriptos, recaudación
│   └── admin/      # solicitudes, cursos, instructores, administradores, recaudación
├── types/          # tipos del dominio
└── utils/          # formatos es-AR, reglas de inscripción, hooks de carga y de errores de formulario
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
  mensaje devuelto por el servidor (`detail`, o `mensaje` en el formato anterior).
- Las inscripciones no se cancelan (el backend no lo permite).
- El descuento de fidelidad lo calcula el backend al confirmar; el front no lo estima. Si hay
  una inscripción previa del mismo mes y especialidad, muestra un aviso informativo.
- El precio final abonado se muestra en "Mis cursos" y en el toast posterior a la inscripción.
- Los cupos se calculan con `GET /enrollments` porque no hay endpoint de conteo por curso.
- La recaudación del instructor usa `GET /instructors/{id}/revenue`; el desglose por curso se
  calcula en el front (65 % × precio base × inscriptos) y se aclara en pantalla.

## Suposiciones y discrepancias pendientes

Documentadas en detalle en [`API_CONTRACT.md`](./API_CONTRACT.md). Resumen:

1. **Autenticación JWT**: el front usa `POST /api/auth/token` y, mientras el backend no lo
   tenga, prueba los tres logins viejos. Deduce el rol del token. El perfil del alumno no está
   expuesto: `GET /api/students/{id}` es solo para administradores, por lo que la barra
   muestra su email.
2. **CORS**: el backend lo configura con `CORS_ALLOWED_ORIGINS`; igual el front usa el proxy
   de Vite en desarrollo y el de nginx en producción.
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
