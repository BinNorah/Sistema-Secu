# Contrato HTTP

Todas las rutas usan JSON bajo `/api`. Los endpoints actuales de solicitudes y calificaciones se conservan para no romper los clientes existentes. Los endpoints de catalogo y administracion permanecen protegidos por JWT y roles.

## Rutas implementadas

| Metodo | Ruta | Acceso | Uso |
|---|---|---|---|
| POST | `/api/auth/login` | Publico | Iniciar sesion y obtener JWT |
| GET | `/api/auth/me` | Autenticado | Consultar la cuenta activa |
| POST | `/api/enrollments/public` | Publico | Registrar solicitud de ingreso |
| GET | `/api/enrollments`, `/api/enrollments/stats` | Secretaria/Direccion | Listar y resumir solicitudes |
| GET, PUT, DELETE | `/api/enrollments/{id}` | Secretaria/Direccion | Consultar, editar o eliminar solicitud |
| PATCH | `/api/enrollments/{id}/state` | Secretaria/Direccion | Transicionar solicitud con State |
| POST | `/api/enrollments/{id}/payment` | Secretaria/Direccion | Registrar pago |
| GET, POST | `/api/grades` | Docente/Direccion | Listar o guardar calificaciones B1-B4 |
| GET | `/api/grades/{id}` | Docente/Direccion | Consultar calificacion |
| GET | `/api/grades/{id}/history` | Docente/Direccion | Consultar versiones Memento |
| POST | `/api/grades/{id}/undo`, `/api/grades/{id}/redo` | Docente/Direccion | Deshacer o rehacer |
| POST | `/api/grades/{id}/restore/{mementoId}` | Docente/Direccion | Restaurar una version |
| GET | `/api/director/users`, `/api/director/grades`, `/api/director/sections`, `/api/director/subjects`, `/api/director/assignments` | Direccion | Administrar y consultar referencias |
| POST | `/api/director/users`, `/api/director/subjects`, `/api/director/assignments` | Direccion | Crear usuarios, cursos/asignaturas y asignaciones |
| PATCH, DELETE | `/api/director/users/{id}/toggle`, `/api/director/assignments/{id}` | Direccion | Actualizar estado o eliminar asignacion |
| GET | `/api/academic/grades`, `/api/academic/sections`, `/api/academic/subjects`, `/api/academic/assignments` | Autenticado | Consultar referencias academicas |

Las respuestas de las rutas existentes usan `{ "success": true, "data": ... }`; los errores incluyen un mensaje en `error`. Codigos: 200/201 para exito, 400 para entrada invalida, 401/403 para autenticacion/autorizacion, 404 para recursos inexistentes, 409 para conflictos de negocio y 500 para errores inesperados.

## Esquema academico

Las tablas normalizadas de `migrations/002_modelo_academico.sql` quedan preparadas para matriculas, notas por periodo, asistencia y horarios. Se mantienen separadas del flujo de solicitud y del API heredado mientras los clientes actuales usan sus contratos existentes.
