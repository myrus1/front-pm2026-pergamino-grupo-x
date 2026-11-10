# API Contract — Frontend E-Learning

Contrato **real** extraído del backend Spring ubicado en `../pm2026-pergamino-grupo-x/demo`
(paquetes `course`, `user`, `enrollment`, `approval`, `auth`).

- Base URL: `http://localhost:8080/api` (el front usa `/api` + proxy de Vite en desarrollo).
- Formato: JSON. Fechas `yyyy-MM-dd` (`LocalDate`) o ISO-8601 sin zona (`LocalDateTime`).
- Montos: `BigDecimal` serializado como número (`45000.00`).
- Errores: `{ "mensaje": "..." }` con códigos 400, 404, 409 y 500.
- Autenticación: **no existe un mecanismo completo**. Ver sección "Autenticación".

## Autenticación

El backend **no expone** `POST /auth/login`, no usa Spring Security, no valida tokens en los
endpoints `/api/**` y no configura CORS. El paquete `auth` es parcial: solo autentica
instructores vía JWT.

| Método | Endpoint real | Uso en el front |
| --- | --- | --- |
| POST | `/instructor/auth` (fuera de `/api`) | No se usa: devuelve solo `{ token }`, sin datos del usuario, y no cubre alumnos ni administradores. |
| POST | `/instructor` | No se usa: duplica el alta de instructores sin especialidades. |

**Modo demo del front** (`src/api/auth.ts`): busca el email ingresado en
`GET /administrators`, `GET /instructors` y `GET /students`. El rol se deduce del origen del
registro. No se verifica la contraseña porque el backend nunca la devuelve (está hasheada).

Si más adelante el backend expone `POST /auth/login` con `{ token, user }`, alcanza con definir
`VITE_AUTH_ENDPOINT=/auth/login`; el resto del front ya usa ese contrato.

## Endpoints utilizados

### Especialidades

| Método | Endpoint | Respuesta |
| --- | --- | --- |
| GET | `/specialties` | `Specialty[]` → `{ id, name }[]` |

Las especialidades son entidades (no un enum): la base contiene `PROGRAMMING`, `DESIGN`,
`MARKETING`, `LANGUAGES`, `BUSINESS` y otras variantes creadas por pruebas.

### Cursos

| Método | Endpoint | Body / Query | Respuesta |
| --- | --- | --- | --- |
| GET | `/courses` | — | `Course[]` |
| GET | `/courses/{id}` | — | `Course` |
| POST | `/courses` | `CourseRequest` | `Course` (201) |
| PUT | `/courses/{id}` | `CourseRequest` | `Course` |
| DELETE | `/courses/{id}` | — | 204 |

`CourseRequest`:
```json
{
  "title": "string",
  "description": "string | null",
  "basePrice": 45000.0,
  "startDate": "2026-12-01",
  "endDate": "2027-01-15",
  "maxCapacity": 30,
  "specialtyId": 1,
  "instructorId": 3
}
```

`Course`:
```json
{
  "id": 1,
  "title": "Java desde cero",
  "description": "Curso de java desde cero",
  "basePrice": 45000.00,
  "startDate": "2026-11-26",
  "endDate": "2027-01-25",
  "maxCapacity": 30,
  "status": "PUBLISHED",
  "specialtyId": 1,
  "instructorId": 3
}
```

`status`: `DRAFT | PENDING_APPROVAL | PUBLISHED`. No se envía en create/update: solo cambia por
una solicitud de aprobación. `GET /courses` **no** acepta `status` ni `specialty`; solo
`studentId` (cursos de un alumno). El front filtra estado/especialidad localmente.

### Estudiantes

| Método | Endpoint | Body / Query | Respuesta |
| --- | --- | --- | --- |
| GET | `/students` | `courseId?` | `Student[]` |
| POST | `/students` | `StudentRequest` | `Student` (201) |

`StudentRequest`: `{ firstName, lastName, email, password, dni }`.
`Student`: `{ id, firstName, lastName, email, dni }` (sin password).

Usado para: registro público, listado de inscriptos de un curso (`?courseId=`) y login demo.

### Instructores

| Método | Endpoint | Body | Respuesta |
| --- | --- | --- | --- |
| GET | `/instructors` | — | `Instructor[]` → `{ id, firstName, lastName, email }[]` |
| POST | `/instructors` | `InstructorRequest` | `Instructor` (201) |
| GET | `/instructors/{id}/revenue` | — | `{ total }` |
| PUT | `/instructors/{id}/specialties/{specialtyId}` | — | 204 |
| DELETE | `/instructors/{id}/specialties/{specialtyId}` | — | 204 |

No existe `PATCH /instructors/{id}/approve` ni un estado "pendiente" de instructor: el alta es
directa. Tampoco existe un endpoint que devuelva las especialidades de un instructor.

### Administradores

| Método | Endpoint | Body | Respuesta |
| --- | --- | --- | --- |
| GET | `/administrators` | — | `Administrator[]` |
| POST | `/administrators` | `AdministratorRequest` | `Administrator` (201) |

### Inscripciones

| Método | Endpoint | Body | Respuesta |
| --- | --- | --- | --- |
| GET | `/enrollments` | — | `Enrollment[]` |
| POST | `/enrollments` | `{ studentId, courseId }` | `Enrollment` (201) |
| GET | `/enrollments/revenue` | — | `{ total }` |

`Enrollment`: `{ id, enrollmentDate, finalAmount, studentId, courseId }`.

El backend calcula `finalAmount` (incluye el descuento de fidelidad del 25 % si corresponde).
No hay cancelación ni endpoint de inscripciones por curso/alumno: el front filtra
`GET /enrollments`.

### Solicitudes de aprobación

| Método | Endpoint | Body / Query | Respuesta |
| --- | --- | --- | --- |
| GET | `/approval-requests` | `status?`, `instructorId?` | `ApprovalRequest[]` |
| POST | `/approval-requests` | `{ courseId, instructorComment? }` | `ApprovalRequest` (201) |
| POST | `/approval-requests/{id}/approve` | `{ administratorId, administratorComment? }` | `ApprovalRequest` |
| POST | `/approval-requests/{id}/reject` | `{ administratorId, administratorComment }` | `ApprovalRequest` |

`ApprovalRequest`:
```json
{
  "id": 1,
  "courseId": 12,
  "status": "SUBMITTED",
  "requestDate": "2026-11-10T10:15:30",
  "resolutionDate": null,
  "instructorComment": "Listo para revisar",
  "administratorComment": null,
  "administratorId": null
}
```

`status`: `SUBMITTED | APPROVED | REJECTED`. Aprobar publica el curso; rechazar lo vuelve a
`DRAFT`. El backend no exige comentario al rechazar: la exigencia es una regla de UI.

## Códigos de error

| Código | Cuándo | Ejemplo de mensaje |
| --- | --- | --- |
| 400 | Datos inválidos / campos requeridos | `"El titulo no puede ser nulo"` |
| 401 | Solo el login de instructor (`/instructor/auth`) | `"Email o contraseña incorrectos"` |
| 403 | Token inválido en `/instructor/courses` (no usado) | `"Token invalido o vencido"` |
| 404 | Entidad inexistente | `"Curso no encontrado con id 99"` |
| 409 | Email/DNI duplicado, curso lleno, no publicado, ya inscripto, etc. | `"El curso esta lleno"` |
| 500 | Error no controlado | — |

El front muestra `mensaje` del backend cuando existe y, si no, un texto por código de estado.

## Diferencias con el contrato del enunciado (sección 6)

| Enunciado | Backend real | Resolución en el front |
| --- | --- | --- |
| `POST /auth/login` | No existe | Login demo por email vía listados |
| `GET /courses?status=&specialty=` | Solo `studentId` | Filtros locales |
| `GET /instructors/me/courses` | No existe | `GET /courses` filtrado por `instructorId` |
| `POST /courses/{id}/approval-requests` | `POST /approval-requests` con `courseId` | Se usa el real |
| `GET /instructors/me/approval-requests` | `GET /approval-requests?instructorId=` | Se usa el real |
| `PATCH /approval-requests/{id}/approve\|reject` | `POST /approval-requests/{id}/approve\|reject` | Se usa el real |
| `POST /courses/{id}/enrollments` | `POST /enrollments` con `{ studentId, courseId }` | Se usa el real |
| `GET /students/me/enrollments` | `GET /enrollments` | Filtro local por `studentId` |
| `GET /courses/{id}/enrollments` | `GET /students?courseId=` | Se usa el real |
| `GET /instructors/me/revenue` | `GET /instructors/{id}/revenue` | Se usa el real |
| `GET /admin/revenue` | `GET /enrollments/revenue` | Se usa el real |
| `PATCH /instructors/{id}/approve` | No existe (alta directa) | No se muestra flujo de aprobación |
| `specialties` como enum | Entidad con id/nombre | Se cargan desde `/specialties` |
| Instructor con `specialties[]` en el response | No se devuelven | Selector muestra todas; el backend valida |
| CORS | No configurado | Proxy `/api` de Vite en desarrollo |
