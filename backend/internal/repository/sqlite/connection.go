package sqlite

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite" // Pure Go SQLite driver without CGO/GCC
	"sistema-colegio/migrations"
)

func NewConnection(dbPath string) (*sql.DB, error) {
	dir := filepath.Dir(dbPath)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("error creating database dir: %w", err)
		}
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("error opening sqlite: %w", err)
	}
	db.SetMaxOpenConns(1)

	if _, err := db.Exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;"); err != nil {
		return nil, fmt.Errorf("error setting pragmas: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("sqlite ping error: %w", err)
	}

	if err := Migrate(db); err != nil {
		return nil, fmt.Errorf("migration error: %w", err)
	}

	return db, nil
}

func Migrate(db *sql.DB) error {
	if err := migrations.Apply(db); err != nil {
		return fmt.Errorf("numbered migrations failed: %w", err)
	}

	return seedInitialData(db)
}

func hashPassword(plain string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(bytes)
}

func seedInitialData(db *sql.DB) error {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return seedAcademicModel(db)
	}

	now := time.Now()

	// 1. Users with required credentials:
	// Secretaría: secretaria / Secre123*
	// Director: director / Direc123*
	// Profesor: profesor / Profe123*
	hashSec := hashPassword("Secre123*")
	hashDir := hashPassword("Direc123*")
	hashPro := hashPassword("Profe123*")

	_, err := db.Exec(`
		INSERT INTO users (id, username, full_name, email, password_hash, role, is_active, created_at) VALUES
		(1, 'secretaria', 'Lic. Carmen Rosa Mendoza', 'secretaria@colegio.edu.pe', ?, 'secretaria', 1, ?),
		(2, 'director', 'Dr. Roberto Carlos Salazar', 'director@colegio.edu.pe', ?, 'director', 1, ?),
		(3, 'profesor', 'Prof. Manuel Alejandro Castro', 'profesor@colegio.edu.pe', ?, 'profesor', 1, ?),
		(4, 'profesor2', 'Prof. Ana María Benites', 'ana.benites@colegio.edu.pe', ?, 'profesor', 1, ?);
	`, hashSec, now, hashDir, now, hashPro, now, hashPro, now)
	if err != nil {
		return err
	}

	// 2. Grade Levels (Secondary School: 1° to 5°)
	_, err = db.Exec(`
		INSERT INTO grade_levels (id, name) VALUES
		(1, '1° de Secundaria'),
		(2, '2° de Secundaria'),
		(3, '3° de Secundaria'),
		(4, '4° de Secundaria'),
		(5, '5° de Secundaria');
	`)
	if err != nil {
		return err
	}

	// 3. Sections
	_, err = db.Exec(`
		INSERT INTO sections (id, grade_level_id, name, classroom) VALUES
		(1, 3, 'A', 'Aula 301 - Pabellón B'),
		(2, 3, 'B', 'Aula 302 - Pabellón B'),
		(3, 4, 'A', 'Aula 401 - Pabellón C');
	`)
	if err != nil {
		return err
	}

	// 4. Subjects
	_, err = db.Exec(`
		INSERT INTO subjects (id, name, code, description) VALUES
		(1, 'Matemáticas', 'MAT-SEC', 'Álgebra, Geometría y Razonamiento'),
		(2, 'Comunicación', 'COM-SEC', 'Comprensión Lectora y Redacción'),
		(3, 'Ciencia y Tecnología', 'CYT-SEC', 'Física, Química y Biología'),
		(4, 'Ciencias Sociales', 'CCSS-SEC', 'Historia, Geografía y Economía'),
		(5, 'Inglés', 'ING-SEC', 'Idioma Extranjero');
	`)
	if err != nil {
		return err
	}

	// 5. Teacher Assignments
	_, err = db.Exec(`
		INSERT INTO teacher_assignments (id, teacher_id, subject_id, grade_level, section, created_at) VALUES
		(1, 3, 1, '3° de Secundaria', 'A', ?),
		(2, 3, 1, '3° de Secundaria', 'B', ?),
		(3, 3, 3, '3° de Secundaria', 'A', ?),
		(4, 4, 2, '3° de Secundaria', 'A', ?);
	`, now, now, now, now)
	if err != nil {
		return err
	}

	// 6. Students
	_, err = db.Exec(`
		INSERT INTO students (id, names, surnames, dni, birth_date, grade_level, academic_year, created_at) VALUES
		(1, 'Mateo Alejandro', 'Villanueva Carranza', '73489215', '2011-05-14', '3° de Secundaria', '2026', ?),
		(2, 'Valeria Sofía', 'Gómez Salcedo', '74918234', '2011-08-22', '3° de Secundaria', '2026', ?),
		(3, 'Lucas Daniel', 'Silva Prado', '72849102', '2011-02-10', '3° de Secundaria', '2026', ?);
	`, now, now, now)
	if err != nil {
		return err
	}

	// 7. Guardians
	_, err = db.Exec(`
		INSERT INTO guardians (id, student_id, names, surnames, dni, phone, email, relationship, created_at) VALUES
		(1, 1, 'Elena Patricia', 'Carranza Ríos', '09843211', '984215889', 'elena.carranza@gmail.com', 'Madre', ?),
		(2, 2, 'Carlos Alberto', 'Gómez Torres', '08472910', '971829440', 'carlos.gomez@gmail.com', 'Padre', ?),
		(3, 3, 'Mariana Lucía', 'Prado Vélez', '07194820', '955182901', 'mariana.prado@gmail.com', 'Madre', ?);
	`, now, now, now)
	if err != nil {
		return err
	}

	// 8. Enrollments
	_, err = db.Exec(`
		INSERT INTO enrollments (id, code, student_id, grade_level, section, academic_year, status, report_card_url, observation, payment_status, payment_amount, created_at, updated_at) VALUES
		(1, 'SOL-2026-0001', 1, '3° de Secundaria', 'A', '2026', 'Pendiente', '/uploads/boleta_ejemplo.pdf', 'Expediente completo con boleta de notas validada', 'Pagado', 920.00, ?, ?),
		(2, 'MAT-2026-SEC-0002', 2, '3° de Secundaria', 'A', '2026', 'Aprobada', '/uploads/boleta_ejemplo.pdf', 'Matrícula formalizada en SIAGIE', 'Pagado', 920.00, ?, ?),
		(3, 'SOL-2026-0003', 3, '3° de Secundaria', 'A', '2026', 'Observada', '/uploads/boleta_ejemplo.pdf', 'Falta adjuntar constancia de no adeudo del colegio anterior', 'Pendiente', 920.00, ?, ?);
	`, now, now, now, now, now, now)
	if err != nil {
		return err
	}

	// 9. Payments
	_, err = db.Exec(`
		INSERT INTO payments (id, enrollment_id, amount, voucher_number, status, payment_date) VALUES
		(1, 1, 920.00, 'B001-0048291', 'Pagado', ?),
		(2, 2, 920.00, 'B001-0048292', 'Pagado', ?);
	`, now, now)
	if err != nil {
		return err
	}

	// 10. Grades (Originator in Memento pattern)
	_, err = db.Exec(`
		INSERT INTO grades (id, student_id, teacher_id, subject_id, grade_level, section, b1, b2, b3, b4, average, observation, current_version, created_at, updated_at) VALUES
		(1, 2, 3, 1, '3° de Secundaria', 'A', 16.0, 17.5, 18.0, 17.0, 17.1, 'Excelente desempeño en álgebra', 2, ?, ?),
		(2, 1, 3, 1, '3° de Secundaria', 'A', 14.5, 15.0, 16.0, 15.5, 15.3, 'Participación constante', 1, ?, ?);
	`, now, now, now, now)
	if err != nil {
		return err
	}

	// 11. Grade Mementos (Snapshots)
	_, err = db.Exec(`
		INSERT INTO grade_mementos (id, grade_id, version, b1, b2, b3, b4, average, observation, teacher_id, action, created_at) VALUES
		(1, 1, 1, 14.0, 15.0, 16.0, 15.0, 15.0, 'Evaluación preliminar B1-B2', 3, 'CREACION', ?),
		(2, 1, 2, 16.0, 17.5, 18.0, 17.0, 17.1, 'Actualización tras entrega de proyectos', 3, 'MODIFICACION', ?),
		(3, 2, 1, 14.5, 15.0, 16.0, 15.5, 15.3, 'Registro inicial', 3, 'CREACION', ?);
	`, now.Add(-2*time.Hour), now, now)
	if err != nil {
		return err
	}

	return seedAcademicModel(db)
}

func seedAcademicModel(db *sql.DB) error {
	statements := []string{
		`INSERT INTO cursos (asignatura_id, nombre)
		 SELECT id, name FROM subjects
		 WHERE NOT EXISTS (SELECT 1 FROM cursos WHERE asignatura_id = subjects.id)`,
		`INSERT INTO docentes (usuario_id)
		 SELECT id FROM users
		 WHERE LOWER(role) IN ('profesor', 'docente')
		   AND NOT EXISTS (SELECT 1 FROM docentes WHERE usuario_id = users.id)`,
		`INSERT INTO asignaciones (docente_id, curso_id, seccion_id)
		 SELECT d.id, c.id, s.id
		 FROM teacher_assignments ta
		 JOIN docentes d ON d.usuario_id = ta.teacher_id
		 JOIN cursos c ON c.asignatura_id = ta.subject_id
		 JOIN grade_levels gl ON gl.name = ta.grade_level
		 JOIN sections s ON s.grade_level_id = gl.id AND s.name = ta.section
		 WHERE NOT EXISTS (
		   SELECT 1 FROM asignaciones a
		   WHERE a.docente_id = d.id AND a.curso_id = c.id AND a.seccion_id = s.id
		 )`,
		`INSERT INTO matriculas (alumno_id, seccion_id, anio_lectivo, estado, fecha_registro)
		 SELECT e.student_id, s.id, CAST(e.academic_year AS INTEGER), 'ACTIVA', e.created_at
		 FROM enrollments e
		 JOIN sections s ON s.name = e.section
		 JOIN grade_levels gl ON gl.id = s.grade_level_id AND gl.name = e.grade_level
		 WHERE LOWER(e.status) IN ('aprobada', 'aprobado')
		   AND NOT EXISTS (
		     SELECT 1 FROM matriculas m
		     WHERE m.alumno_id = e.student_id AND m.anio_lectivo = CAST(e.academic_year AS INTEGER)
		   )`,
	}

	for _, statement := range statements {
		if _, err := db.Exec(statement); err != nil {
			return fmt.Errorf("seed academic model: %w", err)
		}
	}

	for _, period := range []struct {
		number int
		column string
	}{
		{number: 1, column: "b1"},
		{number: 2, column: "b2"},
		{number: 3, column: "b3"},
		{number: 4, column: "b4"},
	} {
		statement := fmt.Sprintf(`
			INSERT INTO notas (matricula_id, asignacion_id, periodo, valor, observacion)
			SELECT m.id, a.id, %d, g.%s, COALESCE(g.observation, '')
			FROM grades g
			JOIN matriculas m ON m.alumno_id = g.student_id
			JOIN asignaciones a ON a.curso_id = (
				SELECT c.id FROM cursos c WHERE c.asignatura_id = g.subject_id
			)
			JOIN docentes d ON d.id = a.docente_id AND d.usuario_id = g.teacher_id
			JOIN sections s ON s.id = a.seccion_id AND s.name = g.section
			JOIN grade_levels gl ON gl.id = s.grade_level_id AND gl.name = g.grade_level
			WHERE m.anio_lectivo = CAST(
				(SELECT st.academic_year FROM students st WHERE st.id = g.student_id) AS INTEGER
			)
				AND g.%s > 0
				AND NOT EXISTS (
					SELECT 1 FROM notas n
					WHERE n.matricula_id = m.id AND n.asignacion_id = a.id AND n.periodo = %d
				)
		`, period.number, period.column, period.column, period.number)
		if _, err := db.Exec(statement); err != nil {
			return fmt.Errorf("migrate existing grades into academic notes: %w", err)
		}
	}

	if _, err := db.Exec(`
		INSERT OR IGNORE INTO nota_historial (nota_id, version, valor, observacion, autor, fecha)
		SELECT n.id, gm.version,
			CASE n.periodo
				WHEN 1 THEN gm.b1
				WHEN 2 THEN gm.b2
				WHEN 3 THEN gm.b3
				ELSE gm.b4
			END,
			COALESCE(gm.observation, ''),
			COALESCE((SELECT u.full_name FROM users u WHERE u.id = gm.teacher_id), 'Sistema'),
			gm.created_at
		FROM grade_mementos gm
		JOIN grades g ON g.id = gm.grade_id
		JOIN matriculas m ON m.alumno_id = g.student_id
		JOIN notas n ON n.matricula_id = m.id
		JOIN asignaciones a ON a.id = n.asignacion_id
		JOIN cursos c ON c.id = a.curso_id AND c.asignatura_id = g.subject_id
		JOIN docentes d ON d.id = a.docente_id AND d.usuario_id = g.teacher_id
		JOIN sections s ON s.id = a.seccion_id AND s.name = g.section
		JOIN grade_levels gl ON gl.id = s.grade_level_id AND gl.name = g.grade_level
		WHERE m.anio_lectivo = CAST(
			(SELECT st.academic_year FROM students st WHERE st.id = g.student_id) AS INTEGER
		)
	`); err != nil {
		return fmt.Errorf("migrate existing grade history: %w", err)
	}

	return nil
}
