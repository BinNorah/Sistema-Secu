ALTER TABLE sections ADD COLUMN academic_year INTEGER NOT NULL DEFAULT 2026;
ALTER TABLE sections ADD COLUMN capacity INTEGER NOT NULL DEFAULT 30;

CREATE TABLE IF NOT EXISTS docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    dni TEXT UNIQUE,
    especialidad TEXT NOT NULL DEFAULT '',
    telefono TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asignatura_id INTEGER UNIQUE REFERENCES subjects(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL UNIQUE,
    horas_semanales INTEGER NOT NULL DEFAULT 0 CHECK (horas_semanales >= 0)
);

CREATE TABLE IF NOT EXISTS asignaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE RESTRICT,
    curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE RESTRICT,
    seccion_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
    UNIQUE (docente_id, curso_id, seccion_id)
);

CREATE TABLE IF NOT EXISTS horarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asignacion_id INTEGER NOT NULL REFERENCES asignaciones(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    aula TEXT NOT NULL,
    CHECK (hora_inicio < hora_fin)
);

CREATE TABLE IF NOT EXISTS matriculas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    seccion_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
    anio_lectivo INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'ACTIVA', 'RETIRADA', 'ANULADA', 'FINALIZADA')),
    fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (alumno_id, anio_lectivo)
);

CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula_id INTEGER NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    asignacion_id INTEGER NOT NULL REFERENCES asignaciones(id) ON DELETE RESTRICT,
    periodo INTEGER NOT NULL CHECK (periodo BETWEEN 1 AND 4),
    valor REAL NOT NULL CHECK (valor BETWEEN 0 AND 20),
    observacion TEXT NOT NULL DEFAULT '',
    UNIQUE (matricula_id, asignacion_id, periodo)
);

CREATE TABLE IF NOT EXISTS nota_historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nota_id INTEGER NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    valor REAL NOT NULL CHECK (valor BETWEEN 0 AND 20),
    observacion TEXT NOT NULL DEFAULT '',
    autor TEXT NOT NULL,
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nota_id, version)
);

CREATE TABLE IF NOT EXISTS asistencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula_id INTEGER NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    horario_id INTEGER NOT NULL REFERENCES horarios(id) ON DELETE RESTRICT,
    fecha TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('PRESENTE', 'TARDANZA', 'FALTA', 'JUSTIFICADA')),
    justificacion TEXT NOT NULL DEFAULT '',
    UNIQUE (matricula_id, horario_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_matriculas_seccion_anio
    ON matriculas(seccion_id, anio_lectivo, estado);
CREATE INDEX IF NOT EXISTS idx_notas_matricula
    ON notas(matricula_id, periodo);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_seccion
    ON asistencias(fecha, horario_id);
