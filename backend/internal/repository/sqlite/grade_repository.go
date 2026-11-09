package sqlite

import (
	"database/sql"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
	"sistema-colegio/internal/domain/patterns/memento"
)

type gradeRepo struct {
	db *sql.DB
}

func NewGradeRepository(db *sql.DB) repository.GradeRepository {
	return &gradeRepo{db: db}
}

func (r *gradeRepo) Create(g *entities.Grade) error {
	query := `
		INSERT INTO grades (student_id, teacher_id, subject_id, grade_level, section, b1, b2, b3, b4, average, observation, current_version, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	res, err := r.db.Exec(query, g.StudentID, g.TeacherID, g.SubjectID, g.GradeLevel, g.Section, g.B1, g.B2, g.B3, g.B4, g.Average, g.Observation, g.CurrentVersion, g.CreatedAt, g.UpdatedAt)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	g.ID = id
	return nil
}

func (r *gradeRepo) CreateWithMemento(g *entities.Grade, snapshot *memento.GradeMemento) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO grades (student_id, teacher_id, subject_id, grade_level, section, b1, b2, b3, b4, average, observation, current_version, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	result, err := tx.Exec(query, g.StudentID, g.TeacherID, g.SubjectID, g.GradeLevel, g.Section, g.B1, g.B2, g.B3, g.B4, g.Average, g.Observation, g.CurrentVersion, g.CreatedAt, g.UpdatedAt)
	if err != nil {
		return err
	}
	g.ID, err = result.LastInsertId()
	if err != nil {
		return err
	}
	snapshot.GradeID = g.ID
	if err := saveMemento(tx, snapshot); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *gradeRepo) GetByID(id int64) (*entities.Grade, error) {
	query := `
		SELECT 
			g.id, g.student_id, (s.names || ' ' || s.surnames) as student_name, s.dni as student_dni,
			g.teacher_id, u.full_name as teacher_name,
			g.subject_id, sub.name as subject_name,
			g.grade_level, g.section, g.b1, g.b2, g.b3, g.b4, g.average, g.observation, g.current_version, g.created_at, g.updated_at
		FROM grades g
		INNER JOIN students s ON g.student_id = s.id
		INNER JOIN users u ON g.teacher_id = u.id
		INNER JOIN subjects sub ON g.subject_id = sub.id
		WHERE g.id = ?
	`
	row := r.db.QueryRow(query, id)

	var g entities.Grade
	err := row.Scan(
		&g.ID, &g.StudentID, &g.StudentName, &g.StudentDNI,
		&g.TeacherID, &g.TeacherName,
		&g.SubjectID, &g.SubjectName,
		&g.GradeLevel, &g.Section, &g.B1, &g.B2, &g.B3, &g.B4, &g.Average, &g.Observation, &g.CurrentVersion, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &g, nil
}

func (r *gradeRepo) GetByStudentSubject(studentID, subjectID int64) (*entities.Grade, error) {
	query := `
		SELECT 
			g.id, g.student_id, (s.names || ' ' || s.surnames) as student_name, s.dni as student_dni,
			g.teacher_id, u.full_name as teacher_name,
			g.subject_id, sub.name as subject_name,
			g.grade_level, g.section, g.b1, g.b2, g.b3, g.b4, g.average, g.observation, g.current_version, g.created_at, g.updated_at
		FROM grades g
		INNER JOIN students s ON g.student_id = s.id
		INNER JOIN users u ON g.teacher_id = u.id
		INNER JOIN subjects sub ON g.subject_id = sub.id
		WHERE g.student_id = ? AND g.subject_id = ?
	`
	row := r.db.QueryRow(query, studentID, subjectID)

	var g entities.Grade
	err := row.Scan(
		&g.ID, &g.StudentID, &g.StudentName, &g.StudentDNI,
		&g.TeacherID, &g.TeacherName,
		&g.SubjectID, &g.SubjectName,
		&g.GradeLevel, &g.Section, &g.B1, &g.B2, &g.B3, &g.B4, &g.Average, &g.Observation, &g.CurrentVersion, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &g, nil
}

func (r *gradeRepo) ListByTeacher(teacherID int64, gradeLevel, section string) ([]*entities.Grade, error) {
	query := `
		SELECT 
			g.id, g.student_id, (s.names || ' ' || s.surnames) as student_name, s.dni as student_dni,
			g.teacher_id, u.full_name as teacher_name,
			g.subject_id, sub.name as subject_name,
			g.grade_level, g.section, g.b1, g.b2, g.b3, g.b4, g.average, g.observation, g.current_version, g.created_at, g.updated_at
		FROM grades g
		INNER JOIN students s ON g.student_id = s.id
		INNER JOIN users u ON g.teacher_id = u.id
		INNER JOIN subjects sub ON g.subject_id = sub.id
		WHERE g.teacher_id = ?
	`
	args := []interface{}{teacherID}

	if gradeLevel != "" {
		query += " AND g.grade_level = ?"
		args = append(args, gradeLevel)
	}
	if section != "" {
		query += " AND g.section = ?"
		args = append(args, section)
	}

	query += " ORDER BY s.surnames ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.Grade
	for rows.Next() {
		var g entities.Grade
		if err := rows.Scan(
			&g.ID, &g.StudentID, &g.StudentName, &g.StudentDNI,
			&g.TeacherID, &g.TeacherName,
			&g.SubjectID, &g.SubjectName,
			&g.GradeLevel, &g.Section, &g.B1, &g.B2, &g.B3, &g.B4, &g.Average, &g.Observation, &g.CurrentVersion, &g.CreatedAt, &g.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, &g)
	}
	return list, nil
}

func (r *gradeRepo) ListByStudent(studentID int64) ([]*entities.Grade, error) {
	query := `
		SELECT 
			g.id, g.student_id, (s.names || ' ' || s.surnames) as student_name, s.dni as student_dni,
			g.teacher_id, u.full_name as teacher_name,
			g.subject_id, sub.name as subject_name,
			g.grade_level, g.section, g.b1, g.b2, g.b3, g.b4, g.average, g.observation, g.current_version, g.created_at, g.updated_at
		FROM grades g
		INNER JOIN students s ON g.student_id = s.id
		INNER JOIN users u ON g.teacher_id = u.id
		INNER JOIN subjects sub ON g.subject_id = sub.id
		WHERE g.student_id = ?
		ORDER BY sub.name ASC
	`
	rows, err := r.db.Query(query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.Grade
	for rows.Next() {
		var g entities.Grade
		if err := rows.Scan(
			&g.ID, &g.StudentID, &g.StudentName, &g.StudentDNI,
			&g.TeacherID, &g.TeacherName,
			&g.SubjectID, &g.SubjectName,
			&g.GradeLevel, &g.Section, &g.B1, &g.B2, &g.B3, &g.B4, &g.Average, &g.Observation, &g.CurrentVersion, &g.CreatedAt, &g.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, &g)
	}
	return list, nil
}

func (r *gradeRepo) Update(g *entities.Grade) error {
	query := `
		UPDATE grades
		SET b1 = ?, b2 = ?, b3 = ?, b4 = ?, average = ?, observation = ?, current_version = ?, updated_at = ?
		WHERE id = ?
	`
	_, err := r.db.Exec(query, g.B1, g.B2, g.B3, g.B4, g.Average, g.Observation, g.CurrentVersion, g.UpdatedAt, g.ID)
	return err
}

func (r *gradeRepo) UpdateWithMemento(g *entities.Grade, snapshot *memento.GradeMemento) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		UPDATE grades
		SET b1 = ?, b2 = ?, b3 = ?, b4 = ?, average = ?, observation = ?, current_version = ?, updated_at = ?
		WHERE id = ?
	`
	result, err := tx.Exec(query, g.B1, g.B2, g.B3, g.B4, g.Average, g.Observation, g.CurrentVersion, g.UpdatedAt, g.ID)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}

	if _, err := tx.Exec(
		"DELETE FROM grade_mementos WHERE grade_id = ? AND version >= ?",
		g.ID,
		g.CurrentVersion,
	); err != nil {
		return err
	}
	snapshot.GradeID = g.ID
	if err := saveMemento(tx, snapshot); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *gradeRepo) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM grades WHERE id = ?", id)
	return err
}

// Memento Operations in SQLite
func (r *gradeRepo) SaveMemento(m *memento.GradeMemento) error {
	return saveMemento(r.db, m)
}

type mementoExecer interface {
	Exec(query string, args ...any) (sql.Result, error)
}

func saveMemento(execer mementoExecer, snapshot *memento.GradeMemento) error {
	query := `
		INSERT INTO grade_mementos (grade_id, version, b1, b2, b3, b4, average, observation, teacher_id, action, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	result, err := execer.Exec(query, snapshot.GradeID, snapshot.Version, snapshot.B1, snapshot.B2, snapshot.B3, snapshot.B4, snapshot.Average, snapshot.Observation, snapshot.TeacherID, snapshot.Action, snapshot.CreatedAt)
	if err != nil {
		return err
	}
	snapshot.ID, err = result.LastInsertId()
	return err
}

func (r *gradeRepo) ListMementos(gradeID int64) ([]*memento.GradeMemento, error) {
	query := `
		SELECT id, grade_id, version, b1, b2, b3, b4, average, observation, teacher_id, action, created_at
		FROM grade_mementos
		WHERE grade_id = ?
		ORDER BY version DESC, id DESC
	`
	rows, err := r.db.Query(query, gradeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*memento.GradeMemento
	for rows.Next() {
		var m memento.GradeMemento
		if err := rows.Scan(&m.ID, &m.GradeID, &m.Version, &m.B1, &m.B2, &m.B3, &m.B4, &m.Average, &m.Observation, &m.TeacherID, &m.Action, &m.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, &m)
	}
	return list, nil
}

func (r *gradeRepo) GetMementoByVersion(gradeID int64, version int) (*memento.GradeMemento, error) {
	query := `
		SELECT id, grade_id, version, b1, b2, b3, b4, average, observation, teacher_id, action, created_at
		FROM grade_mementos
		WHERE grade_id = ? AND version = ?
		ORDER BY id DESC
		LIMIT 1
	`
	row := r.db.QueryRow(query, gradeID, version)

	var m memento.GradeMemento
	err := row.Scan(&m.ID, &m.GradeID, &m.Version, &m.B1, &m.B2, &m.B3, &m.B4, &m.Average, &m.Observation, &m.TeacherID, &m.Action, &m.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

func (r *gradeRepo) GetMementoByID(id int64) (*memento.GradeMemento, error) {
	query := `
		SELECT id, grade_id, version, b1, b2, b3, b4, average, observation, teacher_id, action, created_at
		FROM grade_mementos
		WHERE id = ?
	`
	row := r.db.QueryRow(query, id)

	var m memento.GradeMemento
	err := row.Scan(&m.ID, &m.GradeID, &m.Version, &m.B1, &m.B2, &m.B3, &m.B4, &m.Average, &m.Observation, &m.TeacherID, &m.Action, &m.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

func (r *gradeRepo) GetMaxVersion(gradeID int64) (int, error) {
	var maxV sql.NullInt64
	err := r.db.QueryRow("SELECT MAX(version) FROM grade_mementos WHERE grade_id = ?", gradeID).Scan(&maxV)
	if err != nil {
		return 1, err
	}
	if !maxV.Valid {
		return 1, nil
	}
	return int(maxV.Int64), nil
}
