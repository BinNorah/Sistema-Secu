package sqlite

import (
	"database/sql"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
)

type academicRepo struct {
	db *sql.DB
}

func NewAcademicRepository(db *sql.DB) repository.AcademicRepository {
	return &academicRepo{db: db}
}

func (r *academicRepo) ListGrades() ([]*entities.GradeLevel, error) {
	rows, err := r.db.Query("SELECT id, name FROM grade_levels ORDER BY id ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.GradeLevel
	for rows.Next() {
		var g entities.GradeLevel
		if err := rows.Scan(&g.ID, &g.Name); err != nil {
			return nil, err
		}
		list = append(list, &g)
	}
	return list, nil
}

func (r *academicRepo) ListSections(gradeLevelID int64) ([]*entities.Section, error) {
	query := "SELECT id, grade_level_id, name, classroom FROM sections"
	var args []interface{}
	if gradeLevelID > 0 {
		query += " WHERE grade_level_id = ?"
		args = append(args, gradeLevelID)
	}
	query += " ORDER BY name ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.Section
	for rows.Next() {
		var s entities.Section
		if err := rows.Scan(&s.ID, &s.GradeLevelID, &s.Name, &s.Classroom); err != nil {
			return nil, err
		}
		list = append(list, &s)
	}
	return list, nil
}

func (r *academicRepo) ListSubjects() ([]*entities.Subject, error) {
	rows, err := r.db.Query("SELECT id, name, code, description FROM subjects ORDER BY name ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.Subject
	for rows.Next() {
		var s entities.Subject
		if err := rows.Scan(&s.ID, &s.Name, &s.Code, &s.Description); err != nil {
			return nil, err
		}
		list = append(list, &s)
	}
	return list, nil
}

func (r *academicRepo) CreateSubject(s *entities.Subject) error {
	query := `INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)`
	res, err := r.db.Exec(query, s.Name, s.Code, s.Description)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	s.ID = id
	return nil
}

func (r *academicRepo) ListAssignments() ([]*entities.TeacherAssignment, error) {
	query := `
		SELECT 
			ta.id, ta.teacher_id, u.full_name, ta.subject_id, s.name, ta.grade_level, ta.section, ta.created_at
		FROM teacher_assignments ta
		INNER JOIN users u ON ta.teacher_id = u.id
		INNER JOIN subjects s ON ta.subject_id = s.id
		ORDER BY ta.grade_level ASC, ta.section ASC, s.name ASC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.TeacherAssignment
	for rows.Next() {
		var a entities.TeacherAssignment
		if err := rows.Scan(&a.ID, &a.TeacherID, &a.TeacherName, &a.SubjectID, &a.SubjectName, &a.GradeLevel, &a.Section, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, &a)
	}
	return list, nil
}

func (r *academicRepo) ListAssignmentsByTeacher(teacherID int64) ([]*entities.TeacherAssignment, error) {
	query := `
		SELECT 
			ta.id, ta.teacher_id, u.full_name, ta.subject_id, s.name, ta.grade_level, ta.section, ta.created_at
		FROM teacher_assignments ta
		INNER JOIN users u ON ta.teacher_id = u.id
		INNER JOIN subjects s ON ta.subject_id = s.id
		WHERE ta.teacher_id = ?
		ORDER BY ta.grade_level ASC, ta.section ASC
	`
	rows, err := r.db.Query(query, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.TeacherAssignment
	for rows.Next() {
		var a entities.TeacherAssignment
		if err := rows.Scan(&a.ID, &a.TeacherID, &a.TeacherName, &a.SubjectID, &a.SubjectName, &a.GradeLevel, &a.Section, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, &a)
	}
	return list, nil
}

func (r *academicRepo) CreateAssignment(a *entities.TeacherAssignment) error {
	query := `INSERT INTO teacher_assignments (teacher_id, subject_id, grade_level, section, created_at) VALUES (?, ?, ?, ?, ?)`
	res, err := r.db.Exec(query, a.TeacherID, a.SubjectID, a.GradeLevel, a.Section, a.CreatedAt)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	a.ID = id
	return nil
}

func (r *academicRepo) DeleteAssignment(id int64) error {
	_, err := r.db.Exec("DELETE FROM teacher_assignments WHERE id = ?", id)
	return err
}
