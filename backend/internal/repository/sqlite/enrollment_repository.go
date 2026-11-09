package sqlite

import (
	"database/sql"
	"fmt"
	"strings"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
)

type enrollmentRepo struct {
	db *sql.DB
}

func NewEnrollmentRepository(db *sql.DB) repository.EnrollmentRepository {
	return &enrollmentRepo{db: db}
}

func (r *enrollmentRepo) Create(e *entities.Enrollment, s *entities.Student, g *entities.Guardian) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Insert Student
	queryStudent := `
		INSERT INTO students (names, surnames, dni, birth_date, grade_level, academic_year, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	resStudent, err := tx.Exec(queryStudent, s.Names, s.Surnames, s.DNI, s.BirthDate, s.GradeLevel, s.AcademicYear, s.CreatedAt)
	if err != nil {
		return fmt.Errorf("error inserting student: %w", err)
	}
	studentID, err := resStudent.LastInsertId()
	if err != nil {
		return err
	}
	s.ID = studentID
	e.StudentID = studentID

	// 2. Insert Guardian
	queryGuardian := `
		INSERT INTO guardians (student_id, names, surnames, dni, phone, email, relationship, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	resGuardian, err := tx.Exec(queryGuardian, studentID, g.Names, g.Surnames, g.DNI, g.Phone, g.Email, g.Relationship, g.CreatedAt)
	if err != nil {
		return fmt.Errorf("error inserting guardian: %w", err)
	}
	guardianID, err := resGuardian.LastInsertId()
	if err != nil {
		return err
	}
	g.ID = guardianID

	// 3. Insert Enrollment
	queryEnrollment := `
		INSERT INTO enrollments (code, student_id, grade_level, section, academic_year, status, report_card_url, observation, payment_status, payment_amount, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	resEnrollment, err := tx.Exec(queryEnrollment, e.Code, studentID, e.GradeLevel, e.Section, e.AcademicYear, e.Status, e.ReportCardURL, e.Observation, e.PaymentStatus, e.PaymentAmount, e.CreatedAt, e.UpdatedAt)
	if err != nil {
		return fmt.Errorf("error inserting enrollment: %w", err)
	}
	enrollmentID, err := resEnrollment.LastInsertId()
	if err != nil {
		return err
	}
	e.ID = enrollmentID

	return tx.Commit()
}

func (r *enrollmentRepo) GetByID(id int64) (*entities.Enrollment, error) {
	query := `
		SELECT 
			e.id, e.code, e.student_id, e.grade_level, e.section, e.academic_year, e.status, e.report_card_url, e.observation, e.payment_status, e.payment_amount, e.created_at, e.updated_at,
			s.names, s.surnames, s.dni, s.birth_date,
			g.id, g.names, g.surnames, g.dni, g.phone, g.email, g.relationship
		FROM enrollments e
		INNER JOIN students s ON e.student_id = s.id
		LEFT JOIN guardians g ON s.id = g.student_id
		WHERE e.id = ?
	`
	row := r.db.QueryRow(query, id)

	var e entities.Enrollment
	var s entities.Student
	var g entities.Guardian
	var gID sql.NullInt64
	var gNames, gSurnames, gDNI, gPhone, gEmail, gRel sql.NullString

	err := row.Scan(
		&e.ID, &e.Code, &e.StudentID, &e.GradeLevel, &e.Section, &e.AcademicYear, &e.Status, &e.ReportCardURL, &e.Observation, &e.PaymentStatus, &e.PaymentAmount, &e.CreatedAt, &e.UpdatedAt,
		&s.Names, &s.Surnames, &s.DNI, &s.BirthDate,
		&gID, &gNames, &gSurnames, &gDNI, &gPhone, &gEmail, &gRel,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	s.ID = e.StudentID
	s.FullName = s.Names + " " + s.Surnames
	e.Student = &s

	if gID.Valid {
		g.ID = gID.Int64
		g.Names = gNames.String
		g.Surnames = gSurnames.String
		g.FullName = g.Names + " " + g.Surnames
		g.DNI = gDNI.String
		g.Phone = gPhone.String
		g.Email = gEmail.String
		g.Relationship = gRel.String
		e.Guardian = &g
	}

	return &e, nil
}

func (r *enrollmentRepo) List(status, search string) ([]*entities.Enrollment, error) {
	query := `
		SELECT 
			e.id, e.code, e.student_id, e.grade_level, e.section, e.academic_year, e.status, e.report_card_url, e.observation, e.payment_status, e.payment_amount, e.created_at, e.updated_at,
			s.names, s.surnames, s.dni, s.birth_date,
			g.id, g.names, g.surnames, g.dni, g.phone, g.email, g.relationship
		FROM enrollments e
		INNER JOIN students s ON e.student_id = s.id
		LEFT JOIN guardians g ON s.id = g.student_id
		WHERE 1=1
	`
	var args []interface{}
	if status != "" && strings.ToLower(status) != "todos" {
		query += " AND LOWER(e.status) = LOWER(?)"
		args = append(args, status)
	}

	if strings.TrimSpace(search) != "" {
		sPattern := "%" + strings.TrimSpace(search) + "%"
		query += " AND (s.names LIKE ? OR s.surnames LIKE ? OR s.dni LIKE ? OR e.code LIKE ?)"
		args = append(args, sPattern, sPattern, sPattern, sPattern)
	}

	query += " ORDER BY e.id DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.Enrollment
	for rows.Next() {
		var e entities.Enrollment
		var s entities.Student
		var g entities.Guardian
		var gID sql.NullInt64
		var gNames, gSurnames, gDNI, gPhone, gEmail, gRel sql.NullString

		if err := rows.Scan(
			&e.ID, &e.Code, &e.StudentID, &e.GradeLevel, &e.Section, &e.AcademicYear, &e.Status, &e.ReportCardURL, &e.Observation, &e.PaymentStatus, &e.PaymentAmount, &e.CreatedAt, &e.UpdatedAt,
			&s.Names, &s.Surnames, &s.DNI, &s.BirthDate,
			&gID, &gNames, &gSurnames, &gDNI, &gPhone, &gEmail, &gRel,
		); err != nil {
			return nil, err
		}

		s.ID = e.StudentID
		s.FullName = s.Names + " " + s.Surnames
		e.Student = &s

		if gID.Valid {
			g.ID = gID.Int64
			g.Names = gNames.String
			g.Surnames = gSurnames.String
			g.FullName = g.Names + " " + g.Surnames
			g.DNI = gDNI.String
			g.Phone = gPhone.String
			g.Email = gEmail.String
			g.Relationship = gRel.String
			e.Guardian = &g
		}

		list = append(list, &e)
	}
	return list, nil
}

func (r *enrollmentRepo) Update(e *entities.Enrollment) error {
	query := `
		UPDATE enrollments
		SET grade_level = ?, section = ?, status = ?, observation = ?, payment_status = ?, updated_at = ?
		WHERE id = ?
	`
	_, err := r.db.Exec(query, e.GradeLevel, e.Section, e.Status, e.Observation, e.PaymentStatus, e.UpdatedAt, e.ID)
	return err
}

func (r *enrollmentRepo) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM enrollments WHERE id = ?", id)
	return err
}

func (r *enrollmentRepo) GetStats() (map[string]int, error) {
	rows, err := r.db.Query("SELECT status, COUNT(*) FROM enrollments GROUP BY status")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := map[string]int{
		"Total":     0,
		"Pendiente": 0,
		"Aprobada":  0,
		"Observada": 0,
		"Anulada":   0,
	}

	total := 0
	for rows.Next() {
		var st string
		var count int
		if err := rows.Scan(&st, &count); err == nil {
			stats[st] = count
			total += count
		}
	}
	stats["Total"] = total
	return stats, nil
}

func (r *enrollmentRepo) RecordPayment(p *entities.Payment) error {
	query := `
		INSERT INTO payments (enrollment_id, amount, voucher_number, status, payment_date)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(enrollment_id) DO UPDATE SET
			amount = excluded.amount,
			voucher_number = excluded.voucher_number,
			status = excluded.status,
			payment_date = excluded.payment_date
	`
	_, err := r.db.Exec(query, p.EnrollmentID, p.Amount, p.VoucherNumber, p.Status, p.PaymentDate)
	if err != nil {
		return err
	}

	_, err = r.db.Exec("UPDATE enrollments SET payment_status = ? WHERE id = ?", p.Status, p.EnrollmentID)
	return err
}

func (r *enrollmentRepo) GetPaymentByEnrollmentID(enrollmentID int64) (*entities.Payment, error) {
	query := `SELECT id, enrollment_id, amount, voucher_number, status, payment_date FROM payments WHERE enrollment_id = ?`
	var p entities.Payment
	err := r.db.QueryRow(query, enrollmentID).Scan(&p.ID, &p.EnrollmentID, &p.Amount, &p.VoucherNumber, &p.Status, &p.PaymentDate)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}
