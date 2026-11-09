package entities

import "time"

type GradeLevel struct {
	ID   int64  `json:"id"`
	Name string `json:"name"` // "1° de Secundaria", ..., "5° de Secundaria"
}

type Section struct {
	ID           int64  `json:"id"`
	GradeLevelID int64  `json:"grade_level_id"`
	Name         string `json:"name"` // "A", "B", "C"
	Classroom    string `json:"classroom"`
}

type Subject struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"` // "Matemáticas", "Comunicación", etc.
	Code        string `json:"code"`
	Description string `json:"description"`
}

type TeacherAssignment struct {
	ID          int64     `json:"id"`
	TeacherID   int64     `json:"teacher_id"`
	TeacherName string    `json:"teacher_name,omitempty"`
	SubjectID   int64     `json:"subject_id"`
	SubjectName string    `json:"subject_name,omitempty"`
	GradeLevel  string    `json:"grade_level"`
	Section     string    `json:"section"`
	CreatedAt   time.Time `json:"created_at"`
}

type Payment struct {
	ID            int64     `json:"id"`
	EnrollmentID  int64     `json:"enrollment_id"`
	Amount        float64   `json:"amount"`
	VoucherNumber string    `json:"voucher_number"`
	Status        string    `json:"status"` // "Pagado", "Pendiente"
	PaymentDate   time.Time `json:"payment_date"`
}

